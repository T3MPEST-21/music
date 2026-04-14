import { GeneratedArtwork } from '@/components/GeneratedArtwork';
import { SongList } from '@/components/SongList';
import { SongPickerModal } from '@/components/SongPickerModal';
import { useTheme } from '@/constants/theme';
import { SortBy, Track, useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PlaylistDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const insets = useSafeAreaInsets();
    const { colors, fonts, cornerRadius, spacing, isDark } = useTheme();
    const {
        playlists, getPlaylistTracks, tracks,
        renamePlaylist, deletePlaylist, setPlaylistArtwork,
        removeTrackFromPlaylist, reorderPlaylistTracks, sortPlaylist,
        addTracksToPlaylist,
    } = useLibraryStore();
    const { play } = usePlayerStore();

    const playlist = playlists.find(p => p.id === id);

    const [reorderMode, setReorderMode] = useState(false);
    const [focusedTrackId, setFocusedTrackId] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showRename, setShowRename] = useState(false);
    const [newName, setNewName] = useState('');
    const [showSongPicker, setShowSongPicker] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const playlistTracks = getPlaylistTracks(playlist?.id || '');
    const totalDuration = playlistTracks.reduce((sum, t) => sum + (t.duration || 0), 0);
    const durationStr = totalDuration > 0
        ? `${Math.floor(totalDuration / 60)} min`
        : '0 min';
    const filteredTracks = React.useMemo(() => {
        if (!searchQuery.trim()) return playlistTracks;
        const query = searchQuery.toLowerCase();
        return playlistTracks.filter(t =>
            t.title.toLowerCase().includes(query) ||
            t.artist.toLowerCase().includes(query)
        );
    }, [playlistTracks, searchQuery]);

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)/Playlists');
        }
    };

    const handleMove = (direction: 'up' | 'down') => {
        if (!id || !focusedTrackId) return;
        const currentTracks = getPlaylistTracks(id);
        const index = currentTracks.findIndex(t => t.id === focusedTrackId);

        if (direction === 'up' && index > 0) {
            reorderPlaylistTracks(id, index, index - 1);
        } else if (direction === 'down' && index < currentTracks.length - 1) {
            reorderPlaylistTracks(id, index, index + 1);
        }
    };

    const handlePickArtwork = async () => {
        setShowMenu(false);
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setPlaylistArtwork(id!, result.assets[0].uri);
        }
    };

    const handleRename = () => {
        const name = newName.trim();
        if (name && id) renamePlaylist(id, name);
        setShowRename(false);
        setNewName('');
    };

    const handleDelete = () => {
        setShowMenu(false);
        Alert.alert(`Delete "${playlist?.name}"?`, 'This cannot be undone.', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: () => {
                    if (id) deletePlaylist(id);
                    router.back();
                }
            },
        ]);
    };

    const handleSort = (by: SortBy) => {
        if (id) sortPlaylist(id, by);
        setShowSortMenu(false);
        setShowMenu(false);
    };

    if (!playlist) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Playlist not found</Text>
            </View>
        );
    }

    // For song picker: show all tracks NOT already in playlist
    const pickerTracks = tracks.filter(t => !playlist.trackIds.includes(t.id));

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            {/* Header */}
            <View style={[styles.header, { paddingHorizontal: spacing.horizontal }]}>
                {isSearchActive ? (
                    <View style={styles.searchContainer}>
                        <TouchableOpacity onPress={() => { setIsSearchActive(false); setSearchQuery(''); }} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TextInput
                            style={[styles.searchInput, { color: colors.text, fontSize: fonts.md }]}
                            placeholder="Search songs in playlist..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <>
                        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                            <Ionicons name="chevron-back" size={24} color={colors.text} />
                        </TouchableOpacity>

                        {reorderMode ? (
                            <>
                                <Text style={[styles.headerTitle, { color: colors.text, fontSize: fonts.md }]}>Reorder</Text>
                                <TouchableOpacity onPress={() => { setReorderMode(false); setFocusedTrackId(null); }} style={[styles.doneBtn, { backgroundColor: colors.primary }]}>
                                    <Text style={[styles.doneBtnText, { fontSize: fonts.xs }]}>Done</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.headerTitle, { color: colors.text, fontSize: fonts.md }]} numberOfLines={1}>{playlist.name}</Text>
                                <View style={styles.headerActions}>
                                    <TouchableOpacity onPress={() => setIsSearchActive(true)} style={styles.menuBtn}>
                                        <Ionicons name="search" size={20} color={colors.text} />
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setShowMenu(v => !v)}>
                                        <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </>
                )}
            </View>

            {/* ⋮ Dropdown menu */}
            {showMenu && (
                <View style={[styles.dropMenu, {
                    backgroundColor: isDark ? '#2a2a2a' : colors.card,
                    borderRadius: cornerRadius,
                    right: spacing.horizontal
                }]}>
                    <TouchableOpacity style={styles.dropItem} onPress={() => { setShowMenu(false); setShowRename(true); setNewName(playlist.name); }}>
                        <Ionicons name="pencil-outline" size={17} color={colors.text} />
                        <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Rename</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dropItem} onPress={handlePickArtwork}>
                        <Ionicons name="image-outline" size={17} color={colors.text} />
                        <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Change Artwork</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dropItem} onPress={() => setShowSortMenu(v => !v)}>
                        <Ionicons name="swap-vertical" size={17} color={colors.text} />
                        <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Sort...</Text>
                    </TouchableOpacity>
                    {showSortMenu && (
                        <>
                            {(['title', 'artist', 'duration', 'dateAdded'] as SortBy[]).map(s => (
                                <TouchableOpacity key={s} style={[styles.dropItem, styles.subItem]} onPress={() => handleSort(s)}>
                                    <Text style={[styles.subLabel, { color: colors.textMuted, fontSize: fonts.xs }]}>
                                        {s === 'title' ? 'By Title' : s === 'artist' ? 'By Artist' : s === 'duration' ? 'By Duration' : 'By Date Added'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                    {!isSearchActive && (
                        <TouchableOpacity style={styles.dropItem} onPress={() => { setShowMenu(false); setReorderMode(true); }}>
                            <Ionicons name="reorder-three" size={17} color={colors.text} />
                            <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Reorder Songs...</Text>
                        </TouchableOpacity>
                    )}
                    {!playlist.isPinned && (
                        <TouchableOpacity style={styles.dropItem} onPress={handleDelete}>
                            <Ionicons name="trash-outline" size={17} color={isDark ? "#e74c3c" : "#d32f2f"} />
                            <Text style={[styles.dropLabel, { color: isDark ? "#e74c3c" : "#d32f2f", fontSize: fonts.sm }]}>Delete Playlist</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Playlist info */}
            <View style={[styles.info, { paddingHorizontal: spacing.horizontal }]}>
                <TouchableOpacity onPress={handlePickArtwork}>
                    {playlist.artworkUri ? (
                        <Image source={{ uri: playlist.artworkUri }} style={[styles.artwork, { borderRadius: cornerRadius + 2 }]} />
                    ) : (
                        <GeneratedArtwork name={playlist.name} size={120} style={[styles.artwork, { borderRadius: cornerRadius + 2 }]} />
                    )}
                    <View style={styles.artworkOverlay}>
                        <Ionicons name="camera-outline" size={18} color="rgba(255,255,255,0.8)" />
                    </View>
                </TouchableOpacity>
                <View style={styles.infoText}>
                    <Text style={[styles.playlistName, { color: colors.text, fontSize: fonts.md }]} numberOfLines={2}>{playlist.name}</Text>
                    <Text style={[styles.playlistMeta, { color: colors.textMuted, fontSize: fonts.xs }]}>{playlistTracks.length} songs · {durationStr}</Text>
                    {playlistTracks.length > 0 && (
                        <TouchableOpacity
                            style={[styles.playBtn, { backgroundColor: colors.primary }]}
                            onPress={() => playlistTracks.length > 0 && play(playlistTracks[0], playlistTracks, `playlist-${id}`)}
                        >
                            <Ionicons name="play" size={16} color="#fff" />
                            <Text style={[styles.playBtnText, { fontSize: fonts.xs }]}>Play All</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Song list */}
            <SongList
                tracks={filteredTracks}
                reorderMode={reorderMode}
                focusedTrackId={focusedTrackId}
                contextId={`playlist-${id}`}
                onSelect={(track: Track) => {
                    if (reorderMode) {
                        setFocusedTrackId(track.id === focusedTrackId ? null : track.id);
                    } else {
                        play(track, filteredTracks, `playlist-${id}`);
                    }
                }}
                onRemove={(track) => id && removeTrackFromPlaylist(id, track.id)}
            />

            {/* Global Reorder Bar */}
            {reorderMode && (
                <View style={[styles.reorderBar, {
                    backgroundColor: isDark ? '#222' : '#fff',
                    bottom: 0,
                    paddingBottom: Math.max(insets.bottom, 20)
                }]}>
                    {/* move up */}
                    <View style={styles.reorderControls}>
                        <TouchableOpacity
                            onPress={() => handleMove('up')}
                            disabled={!focusedTrackId}
                            style={[styles.reorderActionBtn, !focusedTrackId && { opacity: 0.3 }]}
                        >
                            <Ionicons name="arrow-up" size={24} color={colors.primary} />
                        </TouchableOpacity>

                        {/* info */}
                        <View style={styles.reorderInfo}>
                            <Text style={[styles.reorderInfoText, { color: colors.text, fontSize: fonts.sm }]} numberOfLines={1}>
                                {focusedTrackId
                                    ? filteredTracks.find(t => t.id === focusedTrackId)?.title || 'Selected Song'
                                    : 'Select a song to move'}
                            </Text>
                        </View>

                        {/* move down */}
                        <TouchableOpacity
                            onPress={() => handleMove('down')}
                            disabled={!focusedTrackId}
                            style={[styles.reorderActionBtn, !focusedTrackId && { opacity: 0.3 }]}
                        >
                            <Ionicons name="arrow-down" size={24} color={colors.primary} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Add Songs FAB */}
            {!reorderMode && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
                    onPress={() => setShowSongPicker(true)}
                >
                    <Ionicons name="add" size={26} color="#fff" />
                </TouchableOpacity>
            )}

            {/* Rename modal */}
            <Modal transparent visible={showRename} animationType="fade" onRequestClose={() => setShowRename(false)}>
                <Pressable style={styles.modalBackdrop} onPress={() => setShowRename(false)}>
                    <Pressable style={[styles.renameModal, { backgroundColor: !isDark ? colors.backgroundLight : '#1e1e1e', borderRadius: cornerRadius + 6 }]} onPress={() => { }}>
                        <Text style={[styles.renameTitle, { color: colors.text, fontSize: fonts.md }]}>Rename Playlist</Text>
                        <TextInput
                            value={newName}
                            onChangeText={setNewName}
                            autoFocus
                            onSubmitEditing={handleRename}
                            returnKeyType="done"
                            placeholderTextColor={colors.textMuted}
                            selectionColor={colors.primary}
                            style={[styles.renameInput, {
                                backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)',
                                color: colors.text,
                                fontSize: fonts.sm
                            }]}
                        />
                        <View style={styles.renameActions}>
                            <TouchableOpacity onPress={() => setShowRename(false)} style={styles.renameCancel}>
                                <Text style={{ color: colors.textMuted, fontSize: fonts.sm }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleRename} style={[styles.renameConfirm, { backgroundColor: colors.primary }]}>
                                <Text style={{ color: '#fff', fontWeight: '700', fontSize: fonts.sm }}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Song picker modal */}
            {showSongPicker && (
                <SongPickerModal
                    visible={showSongPicker}
                    onClose={() => setShowSongPicker(false)}
                    onAdd={(trackIds) => {
                        if (id) addTracksToPlaylist(id, trackIds);
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    backBtn: { marginRight: 8, padding: 4 },
    headerTitle: { flex: 1, fontWeight: '700' },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontWeight: '500',
    },
    clearBtn: {
        padding: 4,
    },
    menuBtn: { padding: 4 },
    doneBtn: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 6 },
    doneBtnText: { color: '#fff', fontWeight: '700' },
    dropMenu: {
        position: 'absolute',
        top: 60,
        paddingVertical: 6,
        minWidth: 200,
        elevation: 12,
        zIndex: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    dropItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    dropLabel: {},
    subItem: { paddingLeft: 44, paddingVertical: 8 },
    subLabel: {},
    info: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        gap: 16,
    },
    artwork: { width: 120, height: 120 },
    artworkOverlay: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.55)',
        borderRadius: 12,
        padding: 5,
    },
    infoText: { flex: 1 },
    playlistName: { fontWeight: '800', marginBottom: 4 },
    playlistMeta: {},
    playBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 12,
        alignSelf: 'flex-start',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    playBtnText: { color: '#fff', fontWeight: '700' },
    fab: {
        position: 'absolute',
        bottom: 100,
        right: 24,
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    renameModal: { padding: 24, width: '85%' },
    renameTitle: { fontWeight: '700', marginBottom: 14 },
    renameInput: {
        borderRadius: 10,
        padding: 14,
        marginBottom: 16,
    },
    renameActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
    renameCancel: { paddingHorizontal: 16, paddingVertical: 10 },
    renameConfirm: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },

    // Global Reorder Bar
    reorderBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        marginVertical: 100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 5,
        paddingBottom: 5,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.05)',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        zIndex: 1000,
        borderRadius: 15,
    },
    reorderInfo: {
        flex: 1,
        alignContent: "center",
        justifyContent: "center",
        paddingHorizontal: 0,
    },
    reorderInfoText: {
        fontWeight: '600',
        textAlign: "center",
    },
    reorderControls: { flexDirection: 'row' },
    reorderActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
