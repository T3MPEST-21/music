import { AddMoodModal } from '@/components/AddMoodModal';
import { useTheme } from '@/constants/theme';
import { Mood, useMoodStore } from '@/stores/moodStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Props {
    visible: boolean;
    trackIds: string[];
    onClose: () => void;
}

export const MoodPickerModal: React.FC<Props> = ({ visible, trackIds, onClose }) => {
    const { colors, fonts, cornerRadius, isDark } = useTheme();
    const { moods, trackMoodMap, setBulkTrackMoods } = useMoodStore();
    const [showAddMood, setShowAddMood] = useState(false);

    // Local selection state
    const [selected, setSelected] = useState<Set<string>>(new Set());

    const handleOpen = () => {
        // If single track, show its current moods. 
        // If bulk selection, start fresh (overwrite mode) to avoid confusion.
        if (trackIds.length === 1) {
            setSelected(new Set(trackMoodMap[trackIds[0]] || []));
        } else {
            setSelected(new Set());
        }
    };

    const toggleMood = (moodId: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(moodId) ? next.delete(moodId) : next.add(moodId);
            return next;
        });
    };

    const handleDone = () => {
        setBulkTrackMoods(trackIds, Array.from(selected));
        onClose();
    };

    const renderMood = ({ item }: { item: Mood }) => {
        const isSelected = selected.has(item.id);
        return (
            <TouchableOpacity
                style={[styles.moodRow, isSelected && { backgroundColor: item.color + '18' }]}
                onPress={() => toggleMood(item.id)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconBadge, { backgroundColor: item.color + '25' }]}>
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={[styles.moodName, { color: colors.text, fontSize: fonts.sm }]}>
                    {item.name}
                </Text>
                <View style={[styles.checkbox, {
                    borderColor: isSelected ? item.color : colors.border,
                    backgroundColor: isSelected ? item.color : 'transparent',
                }]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <>
            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={onClose}
                onShow={handleOpen}
            >
                <Pressable style={styles.backdrop} onPress={onClose}>
                    <View style={[styles.sheet, {
                        backgroundColor: isDark ? '#1a1a1a' : colors.backgroundLight,
                        borderTopLeftRadius: cornerRadius + 6,
                        borderTopRightRadius: cornerRadius + 6,
                    }]}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: colors.text, fontSize: fonts.md }]}>
                                Tag Mood
                            </Text>
                            <TouchableOpacity onPress={handleDone} style={[styles.doneBtn, { backgroundColor: colors.primary }]}>
                                <Text style={[styles.doneBtnText, { fontSize: fonts.xs }]}>Done</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Mood list */}
                        <FlatList
                            data={moods}
                            renderItem={renderMood}
                            keyExtractor={item => item.id}
                            style={styles.list}
                            showsVerticalScrollIndicator={false}
                            ListFooterComponent={
                                <TouchableOpacity
                                    style={[styles.addNewBtn, { borderColor: colors.border }]}
                                    onPress={() => setShowAddMood(true)}
                                >
                                    <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                                    <Text style={[styles.addNewText, { color: colors.primary, fontSize: fonts.sm }]}>
                                        Create New Mood
                                    </Text>
                                </TouchableOpacity>
                            }
                        />
                    </View>
                </Pressable>
            </Modal>

            <AddMoodModal
                visible={showAddMood}
                onClose={() => setShowAddMood(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        maxHeight: '75%',
        paddingTop: 8,
        paddingBottom: 32,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
    },
    title: {
        fontWeight: '700',
    },
    doneBtn: {
        paddingHorizontal: 18,
        paddingVertical: 7,
        borderRadius: 20,
    },
    doneBtnText: {
        color: '#fff',
        fontWeight: '700',
    },
    list: {
        paddingHorizontal: 8,
    },
    moodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderRadius: 12,
        gap: 14,
        marginHorizontal: 4,
        marginBottom: 2,
    },
    iconBadge: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moodName: {
        flex: 1,
        fontWeight: '600',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addNewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
        paddingVertical: 16,
        marginTop: 8,
        borderTopWidth: 1,
        marginHorizontal: 4,
    },
    addNewText: {
        fontWeight: '600',
    },
});
