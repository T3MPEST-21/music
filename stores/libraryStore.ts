import { storage, StorageKeys } from "@/utils/storage";
import * as MediaLibrary from "expo-media-library";
import { create } from "zustand";
import { useToastStore } from "./toastStore";

// ─── Track ────────────────────────────────────────────────────────────────────

export interface Track {
    url: string;
    title: string;
    artist: string;
    album?: string;
    artwork?: string;
    duration: number; // seconds
    id: string;
    dateAdded: number; // modification time
}

// ─── Playlist ─────────────────────────────────────────────────────────────────

export interface Playlist {
    id: string;           // uuid or 'favorites'
    name: string;
    trackIds: string[];   // ordered list of Track IDs
    artworkUri?: string;  // user-picked image; undefined = use generated artwork
    createdAt: number;    // ms timestamp
    isPinned?: boolean;   // true for 'favorites' — cannot be deleted
}

export type SortBy = 'title' | 'artist' | 'duration' | 'dateAdded';

// ─────────────────────────────────────────────────────────────────────────────

const FAVORITES_ID = 'favorites';

function generateId(): string {
    return `pl_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function persistPlaylists(playlists: Playlist[]) {
    try {
        storage.set(StorageKeys.LIBRARY_CACHE + '_playlists', JSON.stringify(playlists));
    } catch (e) {
        console.error('Failed to persist playlists', e);
    }
}

function loadPersistedPlaylists(): Playlist[] {
    try {
        const json = storage.getString(StorageKeys.LIBRARY_CACHE + '_playlists');
        if (json) return JSON.parse(json);
    } catch (e) {
        console.error('Failed to load persisted playlists', e);
    }
    // First launch: seed the Favorites playlist
    return [
        {
            id: FAVORITES_ID,
            name: 'Favorites',
            trackIds: [],
            createdAt: Date.now(),
            isPinned: true,
        },
    ];
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface LibraryState {
    tracks: Track[];
    error: string | null;
    isLoading: boolean;
    initialized: boolean;
    artists: { name: string; tracks: Track[] }[];
    albums: { name: string; tracks: Track[] }[];
    playlists: Playlist[];

    // Library
    fetchTracks: () => Promise<void>;
    loadFromCache: () => void;
    refreshLibrary: () => Promise<void>;

    // Playlist CRUD
    createPlaylist: (name: string, artworkUri?: string) => Playlist;
    deletePlaylist: (id: string) => void;
    renamePlaylist: (id: string, newName: string) => void;
    setPlaylistArtwork: (id: string, uri: string) => void;

    // Tracks in playlist
    addTracksToPlaylist: (playlistId: string, trackIds: string[]) => void;
    removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
    reorderPlaylistTracks: (playlistId: string, fromIndex: number, toIndex: number) => void;
    sortPlaylist: (playlistId: string, by: SortBy) => void;

    // Favorites shortcut
    toggleFavorite: (trackId: string) => void;
    isFavorite: (trackId: string) => boolean;

    // Helpers
    getPlaylistTracks: (playlistId: string) => Track[];
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useLibraryStore = create<LibraryState>((set, get) => {
    const initialPlaylists = loadPersistedPlaylists();

    return {
        tracks: [],
        error: null,
        isLoading: false,
        initialized: false,
        artists: [],
        albums: [],
        playlists: initialPlaylists,

        // ── Library ────────────────────────────────────────────────────────────

        fetchTracks: async () => {
            set({ isLoading: true, error: null });
            try {
                const permission = await MediaLibrary.requestPermissionsAsync();
                if (!permission.granted) {
                    set({ error: "Permission needed to access music", isLoading: false });
                    return;
                }

                let allTracks: Track[] = [];
                let hasNextPage = true;
                let after: string | undefined;

                while (hasNextPage) {
                    const assets = await MediaLibrary.getAssetsAsync({
                        mediaType: MediaLibrary.MediaType.audio,
                        first: 500,
                        after,
                        sortBy: MediaLibrary.SortBy.modificationTime,
                    });

                    const mappedTracks = assets.assets.map((asset) => {
                        let title = asset.filename.replace(/\.[^/.]+$/, "");
                        let artist = "Unknown Artist";

                        const separatorIndex = title.indexOf(" - ");
                        if (separatorIndex !== -1) {
                            artist = title.substring(0, separatorIndex).trim();
                            title = title.substring(separatorIndex + 3).trim();
                        }

                        return {
                            id: asset.id,
                            url: asset.uri,
                            title,
                            artist,
                            duration: asset.duration,
                            album: "Unknown Album",
                            artwork: undefined,
                            dateAdded: asset.modificationTime || Date.now(),
                        };
                    });

                    allTracks = [...allTracks, ...mappedTracks];
                    hasNextPage = assets.hasNextPage;
                    after = assets.endCursor;
                }

                set({ tracks: allTracks, isLoading: false, initialized: true });

                try {
                    storage.set(StorageKeys.LIBRARY_CACHE, JSON.stringify(allTracks));
                } catch (e) {
                    console.error("Failed to cache library", e);
                }

            } catch (e) {
                console.error("Failed to fetch tracks", e);
                set({ error: "Failed to load library", isLoading: false });
            }
        },

        loadFromCache: () => {
            try {
                const json = storage.getString(StorageKeys.LIBRARY_CACHE);
                if (json) {
                    const tracks = JSON.parse(json);
                    set({ tracks, initialized: true, isLoading: false });
                }
            } catch (e) {
                console.error("Failed to load library from cache", e);
            }
        },

        refreshLibrary: async () => get().fetchTracks(),

        // ── Playlist CRUD ──────────────────────────────────────────────────────

        createPlaylist: (name, artworkUri) => {
            const playlist: Playlist = {
                id: generateId(),
                name,
                trackIds: [],
                artworkUri,
                createdAt: Date.now(),
            };
            set(state => {
                const updated = [...state.playlists, playlist];
                persistPlaylists(updated);
                return { playlists: updated };
            });
            useToastStore.getState().showToast(`Playlist "${name}" created`, 'success');
            return playlist;
        },

        deletePlaylist: (id) => {
            if (id === FAVORITES_ID) return; // guard
            set(state => {
                const updated = state.playlists.filter(p => p.id !== id);
                persistPlaylists(updated);
                return { playlists: updated };
            });
            useToastStore.getState().showToast('Playlist deleted', 'info');
        },

        renamePlaylist: (id, newName) => {
            set(state => {
                const updated = state.playlists.map(p =>
                    p.id === id ? { ...p, name: newName } : p
                );
                persistPlaylists(updated);
                return { playlists: updated };
            });
            useToastStore.getState().showToast('Playlist renamed', 'success');
        },

        setPlaylistArtwork: (id, uri) => {
            set(state => {
                const updated = state.playlists.map(p =>
                    p.id === id ? { ...p, artworkUri: uri } : p
                );
                persistPlaylists(updated);
                return { playlists: updated };
            });
        },

        // ── Tracks in playlist ─────────────────────────────────────────────────

        addTracksToPlaylist: (playlistId, trackIds) => {
            set(state => {
                const updated = state.playlists.map(p => {
                    if (p.id !== playlistId) return p;
                    // Deduplicate
                    const existingIds = new Set(p.trackIds);
                    const newIds = trackIds.filter(id => !existingIds.has(id));

                    if (newIds.length > 0) {
                        useToastStore.getState().showToast(`Added ${newIds.length} song${newIds.length > 1 ? 's' : ''}`, 'success');
                    } else if (trackIds.length > 0) {
                        useToastStore.getState().showToast('Already in playlist', 'info');
                    }

                    return { ...p, trackIds: [...p.trackIds, ...newIds] };
                });
                persistPlaylists(updated);
                return { playlists: updated };
            });
        },

        removeTrackFromPlaylist: (playlistId, trackId) => {
            set(state => {
                const updated = state.playlists.map(p =>
                    p.id !== playlistId
                        ? p
                        : { ...p, trackIds: p.trackIds.filter(id => id !== trackId) }
                );
                persistPlaylists(updated);
                return { playlists: updated };
            });
        },

        reorderPlaylistTracks: (playlistId, fromIndex, toIndex) => {
            if (fromIndex < 0 || toIndex < 0) return;
            set(state => {
                const updated = state.playlists.map(p => {
                    if (p.id !== playlistId) return p;
                    const ids = [...p.trackIds];
                    if (fromIndex >= ids.length || toIndex >= ids.length) return p;

                    const [moved] = ids.splice(fromIndex, 1);
                    ids.splice(toIndex, 0, moved);
                    return { ...p, trackIds: ids };
                });
                persistPlaylists(updated);
                return { playlists: updated };
            });
        },

        sortPlaylist: (playlistId, by) => {
            const { tracks } = get();
            const trackMap = new Map(tracks.map(t => [t.id, t]));

            set(state => {
                const updated = state.playlists.map(p => {
                    if (p.id !== playlistId) return p;
                    const sorted = [...p.trackIds].sort((a, b) => {
                        const ta = trackMap.get(a);
                        const tb = trackMap.get(b);
                        if (!ta || !tb) return 0;
                        switch (by) {
                            case 'title': return ta.title.localeCompare(tb.title);
                            case 'artist': return ta.artist.localeCompare(tb.artist);
                            case 'duration': return ta.duration - tb.duration;
                            case 'dateAdded': return 0; // MediaLibrary order — already date-sorted
                        }
                    });
                    return { ...p, trackIds: sorted };
                });
                persistPlaylists(updated);
                return { playlists: updated };
            });
        },

        // ── Favorites shortcut ─────────────────────────────────────────────────

        toggleFavorite: (trackId) => {
            const { playlists } = get();
            const fav = playlists.find(p => p.id === FAVORITES_ID);
            if (!fav) return;

            if (fav.trackIds.includes(trackId)) {
                get().removeTrackFromPlaylist(FAVORITES_ID, trackId);
                useToastStore.getState().showToast('Removed from Favorites', 'info');
            } else {
                get().addTracksToPlaylist(FAVORITES_ID, [trackId]);
                useToastStore.getState().showToast('Added to Favorites', 'success');
            }
        },

        isFavorite: (trackId) => {
            const fav = get().playlists.find(p => p.id === FAVORITES_ID);
            return fav ? fav.trackIds.includes(trackId) : false;
        },

        // ── Helpers ────────────────────────────────────────────────────────────

        getPlaylistTracks: (playlistId) => {
            const { tracks, playlists } = get();
            const playlist = playlists.find(p => p.id === playlistId);
            if (!playlist) return [];
            const trackMap = new Map(tracks.map(t => [t.id, t]));
            return playlist.trackIds
                .map(id => trackMap.get(id))
                .filter((t): t is Track => t !== undefined);
        },
    };
});

export { FAVORITES_ID };
