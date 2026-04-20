import { useTheme } from '@/constants/theme';
import { Track, useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface Props {
    track: Track;
    visible: boolean;
    onClose: () => void;
    onAddToPlaylist: () => void; // Opens PlaylistPickerModal
    onTagMood: () => void; // Opens MoodPickerModal
    onSelectMode: () => void; // Enables selection mode in parent
    onRemove?: () => void; // Optional: Remove from current playlist
}

export const SongContextMenu: React.FC<Props> = ({ track, visible, onClose, onAddToPlaylist, onTagMood, onSelectMode, onRemove }) => {
    const { colors, fonts, cornerRadius } = useTheme();
    const { toggleFavorite, isFavorite } = useLibraryStore();
    const { queue, play } = usePlayerStore();
    const favorite = isFavorite(track.id);

    const handlePlayNext = () => {
        onClose();
    };

    const handleAddToQueue = () => {
        onClose();
    };

    const handleGoToArtist = () => {
        onClose();
        router.push(`/(tabs)/Artists/${encodeURIComponent(track.artist)}`);
    };

    const menuItems: { icon: string; label: string; action: () => void; color?: string }[] = [
        { icon: 'play-skip-forward', label: 'Play Next', action: handlePlayNext },
        { icon: 'add-circle-outline', label: 'Add to Queue', action: handleAddToQueue },
        { icon: 'musical-notes', label: 'Add to Playlist', action: () => { onClose(); onAddToPlaylist(); } },
        {
            icon: favorite ? 'heart' : 'heart-outline',
            label: favorite ? 'Remove from Favorites' : 'Add to Favorites',
            action: () => { toggleFavorite(track.id); onClose(); },
            color: favorite ? colors.danger : undefined,
        },
        { icon: 'person', label: 'Go to Artist', action: handleGoToArtist },
        { icon: 'checkbox-outline', label: 'Select', action: () => { onClose(); onSelectMode(); } },
        { icon: 'pricetag-outline', label: 'Tag Mood', action: () => { onClose(); setTimeout(onTagMood, 300); } },
    ];

    if (onRemove) {
        menuItems.push({
            icon: 'trash-outline',
            label: 'Remove from Playlist',
            action: () => { onClose(); onRemove(); },
            color: colors.danger
        });
    }

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
                <TouchableOpacity 
                    style={styles.backdrop} 
                    activeOpacity={1} 
                    onPress={onClose}
                >
                    <Pressable style={[styles.sheet, { backgroundColor: colors.backgroundLight, borderTopLeftRadius: cornerRadius, borderTopRightRadius: cornerRadius }]} onPress={() => {}}>
                        {/* Track info header */}
                        <View style={styles.header}>
                            <Text style={[styles.trackTitle, { color: colors.text, fontSize: fonts.md }]} numberOfLines={1}>{track.title}</Text>
                            <Text style={[styles.trackArtist, { color: colors.textMuted, fontSize: fonts.sm }]} numberOfLines={1}>{track.artist}</Text>
                        </View>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {menuItems.map((item) => (
                        <TouchableOpacity key={item.label} style={styles.item} onPress={item.action}>
                            <Ionicons
                                name={item.icon as any}
                                size={20}
                                color={item.color ?? colors.text}
                                style={styles.itemIcon}
                            />
                            <Text style={[styles.itemLabel, { color: item.color ?? colors.text, fontSize: fonts.md }]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    </Pressable>
                </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        paddingBottom: 32,
        paddingTop: 8,
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    trackTitle: {
        fontWeight: '700',
    },
    trackArtist: {
        marginTop: 2,
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
        marginBottom: 8,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    itemIcon: {
        width: 28,
    },
    itemLabel: {
        marginLeft: 8,
    },
});
