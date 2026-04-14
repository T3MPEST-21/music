import { useTheme } from '@/constants/theme';
import { usePlayerStore } from '@/stores/playerStore';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Dimensions, FlatList, Image, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
}

export const QueueModal: React.FC<Props> = ({ visible, onClose }) => {
    const { colors, fonts, cornerRadius } = useTheme();
    const { queue, activeTrack, removeFromQueue } = usePlayerStore();

    // Determine upcoming tracks
    const activeIndex = activeTrack ? queue.findIndex(t => t.id === activeTrack.id) : -1;
    const upcomingTracks = activeIndex !== -1 ? queue.slice(activeIndex + 1) : queue;

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <Pressable style={styles.closeArea} onPress={onClose} />
                
                <View style={[styles.sheet, { backgroundColor: colors.backgroundLight, borderTopLeftRadius: cornerRadius, borderTopRightRadius: cornerRadius }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text, fontSize: fonts.md }]}>Upcoming Queue</Text>
                        <TouchableOpacity onPress={onClose} hitSlop={15}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {upcomingTracks.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="musical-notes-outline" size={48} color={colors.textMuted} style={{ opacity: 0.3 }} />
                            <Text style={[styles.emptyText, { color: colors.textMuted, fontSize: fonts.sm }]}>No upcoming tracks in queue</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={upcomingTracks}
                            keyExtractor={(item, index) => `${item.id}-${index}`}
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => (
                                <View style={styles.trackItem}>
                                    <View style={[styles.artworkFallback, { backgroundColor: colors.card, borderRadius: cornerRadius / 2 }]}>
                                        {item.artwork ? (
                                            <Image source={{ uri: item.artwork }} style={styles.artwork} />
                                        ) : (
                                            <Ionicons name="musical-note" size={24} color={colors.primary} style={{ opacity: 0.5 }} />
                                        )}
                                    </View>
                                    
                                    <View style={styles.trackInfo}>
                                        <Text style={[styles.trackTitle, { color: colors.text, fontSize: fonts.sm }]} numberOfLines={1}>{item.title}</Text>
                                        <Text style={[styles.trackArtist, { color: colors.textMuted, fontSize: 12 }]} numberOfLines={1}>{item.artist}</Text>
                                    </View>
                                    
                                    <TouchableOpacity 
                                        style={styles.removeBtn} 
                                        onPress={() => removeFromQueue(item.id)}
                                        hitSlop={10}
                                    >
                                        <Ionicons name="close-circle-outline" size={22} color={colors.danger} />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    closeArea: {
        flex: 1,
    },
    sheet: {
        height: SCREEN_HEIGHT * 0.65,
        paddingTop: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    title: {
        fontWeight: '700',
    },
    divider: {
        height: 1,
        marginHorizontal: 16,
    },
    listContent: {
        paddingVertical: 8,
        paddingBottom: 40,
    },
    trackItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    artworkFallback: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    artwork: {
        width: '100%',
        height: '100%',
    },
    trackInfo: {
        flex: 1,
        marginLeft: 12,
        marginRight: 12,
    },
    trackTitle: {
        fontWeight: '600',
        marginBottom: 2,
    },
    trackArtist: {},
    removeBtn: {
        padding: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    emptyText: {
        marginTop: 4,
    }
});
