import { SongList } from '@/components/SongList';
import { useTheme } from '@/constants/theme';
import { useLibraryStore } from '@/stores/libraryStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View, 
    TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
    visible: boolean;
    onClose: () => void;
    onAdd: (trackIds: string[]) => void;
}

type SortMode = 'title' | 'date';

export const SongPickerModal: React.FC<Props> = ({ visible, onClose, onAdd }) => {
    const { tracks } = useLibraryStore();
    const insets = useSafeAreaInsets();
    const { colors, fonts, cornerRadius, isDark, spacing } = useTheme();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [sortMode, setSortMode] = useState<SortMode>('date');
    const [showMenu, setShowMenu] = useState(false);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const sortedTracks = useMemo(() => {
        let result = [...tracks];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.artist.toLowerCase().includes(query)
            );
        }

        // Sort
        return result.sort((a, b) => {
            if (sortMode === 'title') {
                return a.title.localeCompare(b.title);
            }
            return (b.dateAdded || 0) - (a.dateAdded || 0);
        });
    }, [tracks, sortMode, searchQuery]);

    const handleAdd = () => {
        if (selectedIds.size === 0) return;
        onAdd(Array.from(selectedIds));
        setSelectedIds(new Set());
        onClose();
    };

    const handleSelectAll = () => {
        setSelectedIds(new Set(tracks.map(t => t.id)));
        setShowMenu(false);
    };

    const handleDeselectAll = () => {
        setSelectedIds(new Set());
        setShowMenu(false);
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    {isSearchActive ? (
                        <View style={styles.searchContainer}>
                            <TouchableOpacity onPress={() => { setIsSearchActive(false); setSearchQuery(''); }} style={styles.backBtn}>
                                <Ionicons name="arrow-back" size={24} color={colors.text} />
                            </TouchableOpacity>
                            <TextInput
                                style={[styles.searchInput, { color: colors.text, fontSize: fonts.md }]}
                                placeholder="Search all songs..."
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
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <Ionicons name="close" size={26} color={colors.text} />
                            </TouchableOpacity>

                            <Text style={[styles.title, { color: colors.text, fontSize: fonts.md }]}>Add Songs</Text>

                            <View style={styles.headerRight}>
                                <TouchableOpacity onPress={() => setIsSearchActive(true)} style={styles.menuBtn}>
                                    <Ionicons name="search" size={22} color={colors.text} />
                                </TouchableOpacity>
                                {selectedIds.size > 0 && (
                                    <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
                                        <Text style={[styles.addBtnText, { fontSize: fonts.xs, color: '#fff' }]}>Add ({selectedIds.size})</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={styles.menuBtn}>
                                    <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>

                {/* Dropdown Menu */}
                <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
                    <TouchableOpacity 
                        style={styles.modalBackdropTransparent} 
                        activeOpacity={1} 
                        onPress={() => setShowMenu(false)}
                    >
                        <View style={[styles.dropMenu, {
                            backgroundColor: isDark ? '#2a2a2a' : colors.card,
                            borderRadius: cornerRadius,
                            right: spacing.horizontal,
                            top: insets.top + 60,
                        }]}>
                            <TouchableOpacity style={styles.dropItem} onPress={() => { setSortMode('title'); setShowMenu(false); }}>
                                <Ionicons name="text" size={18} color={sortMode === 'title' ? colors.primary : colors.text} />
                                <Text style={[styles.dropLabel, { color: sortMode === 'title' ? colors.primary : colors.text, fontSize: fonts.sm }]}>Sort by Title</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.dropItem} onPress={() => { setSortMode('date'); setShowMenu(false); }}>
                                <Ionicons name="calendar-outline" size={18} color={sortMode === 'date' ? colors.primary : colors.text} />
                                <Text style={[styles.dropLabel, { color: sortMode === 'date' ? colors.primary : colors.text, fontSize: fonts.sm }]}>Sort by Date</Text>
                            </TouchableOpacity>

                            <View style={[styles.divider, { backgroundColor: colors.border }]} />

                            <TouchableOpacity style={styles.dropItem} onPress={handleSelectAll}>
                                <Ionicons name="checkmark-circle-outline" size={18} color={colors.text} />
                                <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Select All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.dropItem} onPress={handleDeselectAll}>
                                <Ionicons name="close-circle-outline" size={18} color={colors.text} />
                                <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Deselect All</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </Modal>

                <SongList
                    tracks={sortedTracks}
                    selectionMode={true}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    closeBtn: {
        padding: 4,
    },
    title: {
        flex: 1,
        fontWeight: '700',
        paddingLeft: 8,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
        gap: 8,
    },
    backBtn: {
        padding: 4,
    },
    searchInput: {
        flex: 1,
        height: '100%',
        fontWeight: '500',
    },
    clearBtn: {
        padding: 4,
    },
    addBtn: {
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    addBtnText: {
        fontWeight: '700',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuBtn: {
        padding: 4,
    },
    dropMenu: {
        position: 'absolute',
        top: 60,
        borderRadius: 12,
        paddingVertical: 6,
        minWidth: 180,
        elevation: 10,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
    },
    dropItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 10,
    },
    dropLabel: {
        fontWeight: '500',
    },
    divider: {
        height: 1,
        marginVertical: 4,
        opacity: 0.5,
    },
    modalBackdropTransparent: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
