import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoodPickerModal } from '@/components/MoodPickerModal';
import { PlaylistPickerModal } from '@/components/PlaylistPickerModal';

interface BulkActionBarProps {
    selectedIds: Set<string>;
    onClearSelection: () => void;
}

export const BulkActionBar = ({ selectedIds, onClearSelection }: BulkActionBarProps) => {
    const { colors, fonts, spacing, isDark, cornerRadius } = useTheme();
    const insets = useSafeAreaInsets();
    const [showBulkMoodPicker, setShowBulkMoodPicker] = useState(false);
    const [showBulkPlaylistPicker, setShowBulkPlaylistPicker] = useState(false);

    if (selectedIds.size === 0) return null;

    const onClosePicker = () => {
        setShowBulkMoodPicker(false);
        setShowBulkPlaylistPicker(false);
        onClearSelection();
    };

    return (
        <>
            <View style={[styles.bulkBar, { 
                backgroundColor: isDark ? '#1a1a1a' : '#fff',
                bottom: insets.bottom + 70, // Float above tab bar
                borderRadius: cornerRadius,
                marginHorizontal: spacing.horizontal,
            }]}>
                <Text style={[styles.bulkCount, { color: colors.text, fontSize: fonts.sm }]}>
                    {selectedIds.size} Selected
                </Text>
                <View style={styles.bulkActions}>
                    <TouchableOpacity 
                        style={[styles.bulkBtn, { backgroundColor: colors.primary + '15' }]}
                        onPress={() => setShowBulkMoodPicker(true)}
                    >
                        <Ionicons name="pricetag" size={16} color={colors.primary} />
                        <Text style={[styles.bulkBtnText, { color: colors.primary, fontSize: fonts.xs }]}>Mood</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.bulkBtn, { backgroundColor: colors.primary + '15' }]}
                        onPress={() => setShowBulkPlaylistPicker(true)}
                    >
                        <Ionicons name="add-circle" size={16} color={colors.primary} />
                        <Text style={[styles.bulkBtnText, { color: colors.primary, fontSize: fonts.xs }]}>Playlist</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.bulkCloseBtn}
                        onPress={onClearSelection}
                    >
                        <Ionicons name="close" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>
            </View>

            {showBulkMoodPicker && (
                <MoodPickerModal
                    visible={showBulkMoodPicker}
                    trackIds={Array.from(selectedIds)}
                    onClose={onClosePicker}
                />
            )}

            {showBulkPlaylistPicker && (
                <PlaylistPickerModal
                    visible={showBulkPlaylistPicker}
                    trackIds={Array.from(selectedIds)}
                    onClose={onClosePicker}
                />
            )}
        </>
    );
};

const styles = StyleSheet.create({
    bulkBar: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        left: 0,
        right: 0,
    },
    bulkCount: {
        fontWeight: '700',
    },
    bulkActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bulkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    bulkBtnText: {
        fontWeight: 'bold',
    },
    bulkCloseBtn: {
        padding: 4,
    },
});
