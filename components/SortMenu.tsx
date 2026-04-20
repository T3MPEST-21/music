import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/constants/theme';
import { SortMode } from '@/hooks/useLibrarySearch';

interface SortMenuProps {
    visible: boolean;
    sortMode: SortMode;
    onSetSortMode: (mode: SortMode) => void;
    onShuffleAll: () => void;
    onToggleSelectionMode: () => void;
    onRescanLibrary: () => void;
}

export const SortMenu = ({
    visible,
    sortMode,
    onSetSortMode,
    onShuffleAll,
    onToggleSelectionMode,
    onRescanLibrary,
}: SortMenuProps) => {
    const { colors, fonts, spacing, isDark, cornerRadius } = useTheme();

    if (!visible) return null;

    return (
        <View style={[styles.dropMenu, {
            backgroundColor: isDark ? '#2a2a2a' : colors.card,
            borderRadius: cornerRadius,
            right: spacing.horizontal
        }]}>
            <View style={styles.dropHeader}>
                <Text style={[styles.dropTitle, { color: colors.textMuted, fontSize: fonts.xs }]}>SCREEN OPTIONS</Text>
            </View>

            <TouchableOpacity style={styles.dropItem} onPress={onShuffleAll}>
                <Ionicons name="shuffle" size={18} color={colors.text} />
                <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Shuffle All</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dropItem} onPress={onToggleSelectionMode}>
                <Ionicons name="checkbox-outline" size={18} color={colors.text} />
                <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Select Songs</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dropItem} onPress={onRescanLibrary}>
                <Ionicons name="refresh" size={18} color={colors.text} />
                <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Rescan Library</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.dropHeader}>
                <Text style={[styles.dropTitle, { color: colors.textMuted, fontSize: fonts.xs }]}>SORT BY</Text>
            </View>
            {([
                { label: 'Recently Added', key: 'default' },
                { label: 'Title', key: 'title' },
                { label: 'Artist', key: 'artist' },
            ] as { label: string, key: SortMode }[]).map((item) => (
                <TouchableOpacity
                    key={item.key}
                    style={styles.dropItem}
                    onPress={() => onSetSortMode(item.key)}
                >
                    <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>
                        {item.label}
                    </Text>
                    {sortMode === item.key && (
                        <Ionicons name="checkmark" size={16} color={colors.primary} style={{ marginLeft: 'auto' }} />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    dropMenu: {
        position: 'absolute',
        top: 60,
        paddingVertical: 6,
        minWidth: 190,
        elevation: 12,
        zIndex: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    dropHeader: { paddingHorizontal: 16, paddingVertical: 8 },
    dropTitle: { fontWeight: '700', letterSpacing: 0.5 },
    dropItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
    dropLabel: { flex: 1 },
    divider: { height: 1, marginHorizontal: 12, marginVertical: 4 },
});
