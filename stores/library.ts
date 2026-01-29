import { MMKV } from "react-native-mmkv";
import { Track } from "react-native-track-player";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Initialize MMKV
const storageInstance = new MMKV({
  id: "music-library-storage",
});

export const storage = storageInstance;

// Zustand MMKV Storage Adapter
const mmkvStateStorage = {
  setItem: (name: string, value: string) => {
    return storageInstance.set(name, value);
  },
  getItem: (name: string) => {
    const value = storageInstance.getString(name);
    return value ?? null;
  },
  removeItem: (name: string) => {
    return storageInstance.delete(name);
  },
};

export interface Playlist {
  name: string;
  tracks: string[]; // URLs
  artwork?: string;
}

export interface LibraryState {
  tracks: Track[];
  favorites: string[]; // URLs or IDs
  playlists: Playlist[];
  toggleFavorite: (track: Track) => void;
  setTracks: (tracks: Track[]) => void;
  addToFavorites: (track: Track) => void;
  removeFromFavorites: (track: Track) => void;
  createPlaylist: (name: string) => void;
  deletePlaylist: (name: string) => void;
  addTrackToPlaylist: (track: Track, playlistName: string) => void;
  removeTrackFromPlaylist: (trackUrl: string, playlistName: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      tracks: [],
      favorites: [],
      playlists: [],
      toggleFavorite: (track) => {
        const { favorites } = get();
        const isFavorite = favorites.includes(track.url);
        if (isFavorite) {
          set({ favorites: favorites.filter((id) => id !== track.url) });
        } else {
          set({ favorites: [...favorites, track.url] });
        }
      },
      addToFavorites: (track) => {
        const { favorites } = get();
        if (!favorites.includes(track.url)) {
          set({ favorites: [...favorites, track.url] });
        }
      },
      removeFromFavorites: (track) => {
        set({ favorites: get().favorites.filter((id) => id !== track.url) });
      },
      setTracks: (tracks) => set({ tracks }),

      createPlaylist: (name) => {
        const { playlists } = get();
        if (!playlists.find((p) => p.name === name)) {
          set({ playlists: [...playlists, { name, tracks: [] }] });
        }
      },
      deletePlaylist: (name) => {
        set({ playlists: get().playlists.filter((p) => p.name !== name) });
      },
      addTrackToPlaylist: (track, playlistName) => {
        const { playlists } = get();
        set({
          playlists: playlists.map((p) =>
            p.name === playlistName
              ? { ...p, tracks: Array.from(new Set([...p.tracks, track.url])) }
              : p,
          ),
        });
      },
      removeTrackFromPlaylist: (trackUrl, playlistName) => {
        const { playlists } = get();
        set({
          playlists: playlists.map((p) =>
            p.name === playlistName
              ? { ...p, tracks: p.tracks.filter((t) => t !== trackUrl) }
              : p,
          ),
        });
      },
    }),
    {
      name: "library-storage",
      storage: createJSONStorage(() => mmkvStateStorage),
    },
  ),
);
