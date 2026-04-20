import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    Dimensions,
    Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/constants/theme';
import { usePlayerStore } from '@/stores/playerStore';
import { SongItem } from './SongList';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer from 'react-native-track-player';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UpNextSheetProps {
    visible: boolean;
    onClose: () => void;
}

export const UpNextSheet = ({ visible, onClose }: UpNextSheetProps) => {
    const { colors, fonts, spacing, isDark } = useTheme();
    const { queue, activeTrack, isShuffleOn } = usePlayerStore();
    const insets = useSafeAreaInsets();

    // The upcoming tracks are those in the queue after the active track
    // Since we maintain the active track at index 0 in the shuffle logic:
    const upcomingTracks = queue.slice(1);

    const handleSkipTo = async (indexInQueue: number) => {
        // Index is relative to 'upcomingTracks', so add 1
        const actualIndex = indexInQueue + 1;
        await TrackPlayer.skip(actualIndex);
        await TrackPlayer.play();
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                
                <View style={[
                    styles.sheet, 
                    { 
                        backgroundColor: isDark ? '#111' : '#fff',
                        paddingBottom: Math.max(insets.bottom, 20)
                    }
                ]}>
                    {/* Handle */}
                    <View style={styles.handleContainer}>
                        <View style={[styles.handle, { backgroundColor: colors.textMuted, opacity: 0.3 }]} />
                    </View>

                    {/* Header */}
                    <View style={[styles.header, { paddingHorizontal: spacing.horizontal }]}>
                        <View>
                            <Text style={[styles.title, { color: colors.text }]}>Up Next</Text>
                            {isShuffleOn && (
                                <Text style={[styles.subtitle, { color: colors.primary }]}>
                                    <Ionicons name="shuffle" size={12} /> Smart Shuffled
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close-circle" size={28} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={upcomingTracks}
                        keyExtractor={(item, index) => `${item.id}-${index}`}
                        contentContainerStyle={{ paddingHorizontal: 0, paddingBottom: 40 }}
                        renderItem={({ item, index }) => (
                            <SongItem
                                track={item}
                                index={index}
                                isPlaying={false}
                                onSelect={() => handleSkipTo(index)}
                                onMenuPress={() => {}} // Disabled in Up Next for now
                            />
                        )}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} style={{ opacity: 0.3 }} />
                                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                    {isShuffleOn ? "No more random tracks" : "End of queue"}
                                </Text>
                            </View>
                        }
                    />
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    sheet: {
        height: SCREEN_HEIGHT * 0.75,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        overflow: 'hidden',
    },
    handleContainer: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 12,
    },
    handle: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
        paddingTop: 5,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 2,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    closeBtn: {
        padding: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
    },
});
