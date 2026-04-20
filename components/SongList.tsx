import { BulkActionBar } from '@/components/BulkActionBar';
import { MoodPickerModal } from '@/components/MoodPickerModal';
import { PlaylistPickerModal } from '@/components/PlaylistPickerModal';
import { SongContextMenu } from '@/components/SongContextMenu';
import { useTheme } from '@/constants/theme';
import { Track } from '@/stores/libraryStore';
import { useMoodStore } from '@/stores/moodStore';
import { usePlayerStore } from '@/stores/playerStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface SongListProps {
    tracks: Track[];
    /** When true, shows checkboxes for multi-select (used in song picker flow) */
    selectionMode?: boolean;
    onSelectionModeChange?: (active: boolean) => void;
    selectedIds?: Set<string>;
    onSelectionChange?: (ids: Set<string>) => void;
    /** Reorder mode — shows ↑↓ arrows instead of ⋮ */
    reorderMode?: boolean;
    focusedTrackId?: string | null;
    onSelect?: (track: Track) => void;
    onMoveStart?: (index: number, direction: 'up' | 'down') => void;
    onMoveEnd?: () => void;
    onRemove?: (track: Track) => void;
}

const SongItem = ({
    track,
    index,
    isPlaying,
    onSelect,
    selectionMode,
    isSelected,
    onToggleSelect,
    reorderMode,
    onMoveStart,
    onMoveEnd,
    onMenuPress,
    isFocused,
}: {
    track: Track;
    index: number;
    isPlaying: boolean;
    onSelect: () => void;
    selectionMode?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    reorderMode?: boolean;
    isFocused?: boolean;
    onMoveStart?: (direction: 'up' | 'down') => void;
    onMoveEnd?: () => void;
    onMenuPress: () => void;
}) => {
    const { colors, fonts, cornerRadius } = useTheme();
    const { getTrackMoods } = useMoodStore();
    const trackMoods = getTrackMoods(track.id);

    return (
        <TouchableOpacity
            style={[
                styles.itemContainer, 
                isPlaying && { backgroundColor: colors.primary + '15' },
                isFocused && { backgroundColor: colors.primary + '30', borderLeftWidth: 4, borderLeftColor: colors.primary }
            ]}
            onPress={selectionMode ? onToggleSelect : onSelect}
            activeOpacity={0.7}
        >
            {/* Left: checkbox OR reorder arrows OR artwork placeholder */}
            {selectionMode ? (
                <TouchableOpacity style={styles.checkbox} onPress={onToggleSelect}>
                    <Ionicons
                        name={isSelected ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isSelected ? colors.primary : colors.textMuted}
                    />
                </TouchableOpacity>
            ) : reorderMode ? (
                <View style={[styles.artworkPlaceholder, { borderRadius: cornerRadius * 0.7, backgroundColor: colors.backgroundLight, opacity: 0.6 }]}>
                    <Ionicons name="reorder-three" size={20} color={isFocused ? colors.primary : colors.textMuted} />
                </View>
            ) : (
                <View style={[styles.artworkPlaceholder, { borderRadius: cornerRadius * 0.7, backgroundColor: colors.backgroundLight }]}>
                    <Ionicons name="musical-notes" size={22} color={colors.textMuted} />
                </View>
            )}

            {/* Track text */}
            <View style={styles.textContainer}>
                <Text numberOfLines={1} style={[styles.title, { color: isPlaying ? colors.primary : colors.text, fontSize: fonts.sm }]}>
                    {track.title || 'Unknown Title'}
                </Text>
                <View style={styles.artistRow}>
                    <Text numberOfLines={1} style={[styles.artist, { color: colors.textMuted, fontSize: fonts.xs }, trackMoods.length > 0 && { flexShrink: 1 }]}>
                        {track.artist || 'Unknown Artist'}
                    </Text>
                    {trackMoods.length > 0 && (
                        <View style={styles.moodMiniContainer}>
                            {trackMoods.slice(0, 3).map(m => (
                                <View key={m.id} style={[styles.moodMiniBadge, { backgroundColor: m.color + '20' }]}>
                                    <Ionicons name={m.icon as any} size={10} color={m.color} />
                                </View>
                            ))}
                            {trackMoods.length > 3 && (
                                <Text style={{ color: colors.textMuted, fontSize: fonts.xs - 2, marginLeft: 2 }}>+{trackMoods.length - 3}</Text>
                            )}
                        </View>
                    )}
                </View>
            </View>

            {/* Right: ⋮ menu (hidden in selection/reorder mode) */}
            {!selectionMode && !reorderMode && (
                <TouchableOpacity onPress={onMenuPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.menuBtn}>
                    <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

export const SongList = ({
    tracks,
    selectionMode,
    selectedIds,
    onSelectionChange,
    reorderMode,
    focusedTrackId,
    onSelect,
    onMoveStart,
    onMoveEnd,
    onSelectionModeChange,
    onRemove,
    contextId,
}: SongListProps) => {
    const { colors, fonts } = useTheme();
    const { play, activeTrack } = usePlayerStore();
    
    // Internal selection state for "Uncontrolled" mode (triggered from context menu)
    const [internalSelectionMode, setInternalSelectionMode] = useState(false);
    const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set());

    const [contextMenuTrack, setContextMenuTrack] = useState<Track | null>(null);
    const [playlistPickerTrack, setPlaylistPickerTrack] = useState<Track | null>(null);
    const [moodPickerTrack, setMoodPickerTrack] = useState<Track | null>(null);

    // Merge props with internal state
    const isSelectionActive = selectionMode ?? internalSelectionMode;
    const currentSelectedIds = selectedIds ?? internalSelectedIds;

    const toggleSelect = (id: string) => {
        const next = new Set(currentSelectedIds);
        next.has(id) ? next.delete(id) : next.add(id);
        
        if (onSelectionChange) {
            onSelectionChange(next);
        } else {
            setInternalSelectedIds(next);
        }
    };

    const clearSelection = () => {
        setInternalSelectionMode(false);
        setInternalSelectedIds(new Set());
        if (onSelectionChange) onSelectionChange(new Set());
        if (onSelectionModeChange) onSelectionModeChange(false);
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={tracks}
                renderItem={({ item, index }) => (
                    <SongItem
                        track={item}
                        index={index}
                        isPlaying={activeTrack?.id === item.id}
                        isFocused={focusedTrackId === item.id}
                        onSelect={() => onSelect ? onSelect(item) : play(item, tracks, contextId)}
                        selectionMode={isSelectionActive}
                        isSelected={currentSelectedIds.has(item.id)}
                        onToggleSelect={() => toggleSelect(item.id)}
                        reorderMode={reorderMode}
                        onMoveStart={(dir) => onMoveStart?.(index, dir)}
                        onMoveEnd={onMoveEnd}
                        onMenuPress={() => setContextMenuTrack(item)}
                    />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 120, flexGrow: 1 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="musical-notes-outline" size={64} color={colors.textMuted} style={{ opacity: 0.3 }} />
                        <Text style={[styles.emptyText, { color: colors.textMuted, fontSize: fonts.md }]}>
                            No songs found
                        </Text>
                    </View>
                }
            />

            {/* Song context menu */}
            {contextMenuTrack && (
                <SongContextMenu
                    track={contextMenuTrack}
                    visible={!!contextMenuTrack}
                    onClose={() => setContextMenuTrack(null)}
                    onAddToPlaylist={() => {
                        setPlaylistPickerTrack(contextMenuTrack);
                        setContextMenuTrack(null);
                    }}
                    onTagMood={() => {
                        setMoodPickerTrack(contextMenuTrack);
                        setContextMenuTrack(null);
                    }}
                    onSelectMode={() => {
                        setInternalSelectionMode(true);
                        setInternalSelectedIds(new Set([contextMenuTrack.id]));
                        setContextMenuTrack(null);
                    }}
                    onRemove={onRemove ? () => onRemove(contextMenuTrack) : undefined}
                />
            )}

            {/* Playlist picker */}
            {playlistPickerTrack && (
                <PlaylistPickerModal
                    visible={!!playlistPickerTrack}
                    trackIds={[playlistPickerTrack.id]}
                    onClose={() => setPlaylistPickerTrack(null)}
                />
            )}

            {/* Mood picker */}
            {moodPickerTrack && (
                <MoodPickerModal
                    visible={!!moodPickerTrack}
                    trackIds={[moodPickerTrack.id]}
                    onClose={() => setMoodPickerTrack(null)}
                />
            )}

            {/* Bulk Action Bar (Only shows in internal mode or if prop selectionMode is managed) */}
            {isSelectionActive && (
                <BulkActionBar 
                    selectedIds={currentSelectedIds} 
                    onClearSelection={clearSelection} 
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    artworkPlaceholder: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkbox: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    reorderButtons: {
        width: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
        gap: 2,
    },
    arrowBtn: {
        padding: 4,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontWeight: '600',
    },
    artistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    artist: {
        marginTop: 4,
    },
    moodMiniContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 4,
    },
    moodMiniBadge: {
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuBtn: {
        paddingHorizontal: 6,
        paddingVertical: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        paddingVertical: 100,
    },
    emptyText: {
        fontWeight: '600',
    },
});
