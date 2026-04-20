import { SongList } from '@/components/SongList';
import { useTheme } from '@/constants/theme';
import { useLibraryStore } from '@/stores/libraryStore';
import { useMoodStore } from '@/stores/moodStore';
import { usePlayerStore } from '@/stores/playerStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SortMode = 'title' | 'artist' | 'default';

// greeting categories
const greetings = {
    morning: [
        "Today's forecast: 100% chance of music",
        "Rise and shine",
        "Wake up and smell the day 😂",
        "Now playing: your day.",
        "Good morning... at least, that's what the clock claims 🕰️",
        "Morning! Time to pretend we're functioning adults",
        "It's morning, let's make some noise",
        "Good morning! Time to get your groove on",
        "Good morning! (or whatever time your brain thinks it is)",
        "It's morning, so stop yawning!",
        "A morning without music is a warning!",
        "Good morning! Time to get your groove on", 
        "Morning! Time to pretend we're functioning adults 🥸",
        "My bed and I love each other, but my alarm clock is jealous ⏰",
        "Good morning! OR is it??? **checks pulse**",
    ], 
    
    afternoon: [
        "Warning: may cause spontaneous dancing",
        "Afternoon, Time for a new soundtrack 🎶",
        "I'm not a morning person, I'm an afternoon... psych!! 😂",
        "Afternoon motivation",
        "We keep grinding, we keep rocking!!",
        "Afternoon delight, you're shining bright!",
        "It's the afternoon, play a tune!",
        "Late afternoon, time to swoon!",
        "Afternoon! Time to get your groove on 🎶",
        "I'm officially running on caffeine, chaos, and good music 🎶",
        "Currently experiencing life at 15 frames per second 🐌",
        "Afternoon! Productivity levels are plummeting, turn up the volume! 🎚️",
        "If every day is a gift, I'd like a receipt for this afternoon 🧾",
    ], 
    
    evening: [
        "It's evening, time to press play",
        "Evening vibes",
        "Evening motivation",
        "I'm not a night owl, I'm just someone who enjoys the quiet hours 🦉",
        "Night: when the world is asleep, we're awake 🌙",
        "Evening time, feeling prime!",
        "Good evening, what's its meaning?",
        "Sun is leaving, good evening!",
        "Why did the musician get arrested? He was in treble 😂",
        "Time to aggressively relax 🛋️",
        "The time of day when you realize you've accomplished nothing 🏆",
        "I'm not a night owl, I'm just an exhausted pigeon 🐦",
        "Finally dark outside so I can stop feeling bad about staying inside 🌙",
    ],
}

//  get the greetings
const getGreeting = () => {
    const hour = new Date().getHours();
    let timeOfDay: keyof typeof greetings;
    if (hour >= 5 && hour < 12) {
        timeOfDay = 'morning'
    } else if (hour >= 12 && hour < 18) {
        timeOfDay = 'afternoon'
    } else {
        timeOfDay = 'evening'
    }

    // get the array of greetings for current time of day
    const categoryGreetings = greetings[timeOfDay];

    // pick a random index from the array
    const randomIndex = Math.floor(Math.random() * categoryGreetings.length);

    // return the random greeting
    return categoryGreetings[randomIndex];
}

const SongsScreen = () => {
    const { tracks, loadFromCache, isLoading, error, initialized, fetchTracks } = useLibraryStore();
    const { moods, trackMoodMap, getMoodTrackIds, deleteMood } = useMoodStore();
    const insets = useSafeAreaInsets();
    const { colors, fonts, spacing, isDark, cornerRadius } = useTheme();
    const [showMenu, setShowMenu] = useState(false);
    const [sortMode, setSortMode] = useState<SortMode>('default');
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMoodId, setActiveMoodId] = useState<string | 'all'>('all');
    const [actionMoodId, setActionMoodId] = useState<string | null>(null);
    
    // Multi-selection state
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!initialized) loadFromCache();
    }, []);

    const taggedMoods = React.useMemo(() => {
        const activeIds = new Set(Object.values(trackMoodMap).flat());
        return moods.filter(m => activeIds.has(m.id));
    }, [moods, trackMoodMap]);

    const filteredAndSortedTracks = React.useMemo(() => {
        let result = [...tracks];

        // Filter by mood
        if (activeMoodId !== 'all') {
            const moodTracks = new Set(getMoodTrackIds(activeMoodId));
            result = result.filter(t => moodTracks.has(t.id));
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.artist.toLowerCase().includes(query)
            );
        }

        // Sort
        if (sortMode === 'title') result.sort((a, b) => a.title.localeCompare(b.title));
        else if (sortMode === 'artist') result.sort((a, b) => a.artist.localeCompare(b.artist));

        return result;
    }, [tracks, sortMode, searchQuery, activeMoodId, moods]);

    const handleDeleteMood = (moodId: string, moodName: string) => {
        const taggedCount = getMoodTrackIds(moodId).length;
        Alert.alert(
            `Delete '${moodName}'?`,
            taggedCount > 0 
                ? `This mood is tagged to ${taggedCount} song${taggedCount > 1 ? 's' : ''}. Deleting it will untag them.` 
                : "Are you sure you want to delete this mood?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => {
                    deleteMood(moodId);
                    if (activeMoodId === moodId) setActiveMoodId('all');
                } }
            ]
        );
    };

    if (isLoading && tracks.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }, styles.centered]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }, styles.centered]}>
                <Text style={{ color: colors.text, fontSize: fonts.sm }}>{error}</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
            <View style={[styles.headerRow, { paddingHorizontal: spacing.horizontal }]}>
                {isSearchActive ? (
                    <View style={styles.searchContainer}>
                        <TouchableOpacity onPress={() => { setIsSearchActive(false); setSearchQuery(''); }} style={styles.backBtn}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                        <TextInput
                            style={[styles.searchInput, { color: colors.text, fontSize: fonts.md }]}
                            placeholder="Search songs..."
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
                        <Text style={[styles.headerTitle, { color: colors.text }]}>{getGreeting()}</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={() => setIsSearchActive(true)}
                                style={styles.menuBtn}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="search" size={22} color={colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setShowMenu(true)}
                                style={styles.menuBtn}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>

            {/* Sort Menu Dropdown */}
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
                        <View style={styles.dropHeader}>
                            <Text style={[styles.dropTitle, { color: colors.textMuted, fontSize: fonts.xs }]}>SCREEN OPTIONS</Text>
                        </View>

                        <TouchableOpacity style={styles.dropItem} onPress={() => {
                            const shuffled = shuffleArray([...filteredAndSortedTracks]);
                            if (shuffled.length > 0) usePlayerStore.getState().play(shuffled[0], shuffled);
                            setShowMenu(false);
                        }}>
                            <Ionicons name="shuffle" size={18} color={colors.text} />
                            <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Shuffle All</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.dropItem} onPress={() => {
                            fetchTracks();
                            setShowMenu(false);
                        }}>
                            <Ionicons name="refresh" size={18} color={colors.text} />
                            <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Rescan Library</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.dropItem} onPress={() => {
                            setIsSelectionMode(true);
                            setSelectedIds(new Set());
                            setShowMenu(false);
                        }}>
                            <Ionicons name="checkbox-outline" size={18} color={colors.text} />
                            <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Select Songs</Text>
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
                                onPress={() => { setSortMode(item.key); setShowMenu(false); }}
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
                </TouchableOpacity>
            </Modal>

            {/* Mood Chips */}
            {taggedMoods.length > 0 && (
                <View style={{ marginTop: 4 }}>
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: spacing.horizontal, gap: 8, paddingBottom: 12 }}
                    >
                        <TouchableOpacity
                            style={[styles.moodChip, { backgroundColor: activeMoodId === 'all' ? colors.primary + '33' : colors.card, borderColor: activeMoodId === 'all' ? colors.primary : colors.border }]}
                            onPress={() => setActiveMoodId('all')}
                        >
                            <Text style={[{ color: activeMoodId === 'all' ? colors.primary : colors.text, fontSize: fonts.sm, fontWeight: activeMoodId === 'all' ? '700' : '500' }]}>All Songs</Text>
                        </TouchableOpacity>

                        {taggedMoods.map(mood => (
                            <TouchableOpacity
                                key={mood.id}
                                style={[styles.moodChip, { backgroundColor: activeMoodId === mood.id ? mood.color + '33' : colors.card, borderColor: activeMoodId === mood.id ? mood.color : colors.border }]}
                                onPress={() => setActiveMoodId(mood.id)}
                            >
                                <Ionicons name={mood.icon as any} size={14} color={activeMoodId === mood.id ? mood.color : colors.textMuted} />
                                <Text style={[{ color: activeMoodId === mood.id ? mood.color : colors.text, fontSize: fonts.sm, fontWeight: activeMoodId === mood.id ? '700' : '500' }]}>{mood.name}</Text>
                                <TouchableOpacity 
                                    style={{ paddingLeft: 6, marginLeft: 2 }} 
                                    onPress={(e) => { e.stopPropagation(); setActionMoodId(mood.id); }}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <Ionicons name="ellipsis-vertical" size={14} color={activeMoodId === mood.id ? mood.color : colors.textMuted} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Mood Action Modal */}
            <Modal visible={!!actionMoodId} transparent animationType="fade" onRequestClose={() => setActionMoodId(null)}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setActionMoodId(null)}>
                    <View style={[styles.moodMenuSheet, { backgroundColor: isDark ? '#2a2a2a' : colors.card, borderRadius: cornerRadius }]}>
                        {(() => {
                            const selectedMood = moods.find(m => m.id === actionMoodId);
                            if (!selectedMood) return null;
                            const moodTracks = tracks.filter(t => new Set(getMoodTrackIds(selectedMood.id)).has(t.id));

                            return (
                                <>
                                    <View style={styles.dropHeader}>
                                        <Text style={[styles.dropTitle, { color: colors.textMuted, fontSize: fonts.xs }]}>{selectedMood.name.toUpperCase()} MOOD</Text>
                                    </View>
                                    
                                    <TouchableOpacity style={styles.dropItem} onPress={() => {
                                        if (moodTracks.length > 0) usePlayerStore.getState().play(moodTracks[0], moodTracks);
                                        setActionMoodId(null);
                                    }}>
                                        <Ionicons name="play" size={18} color={selectedMood.color} />
                                        <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Play All</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity style={styles.dropItem} onPress={() => {
                                        const shuffled = shuffleArray([...moodTracks]);
                                        if (shuffled.length > 0) usePlayerStore.getState().play(shuffled[0], shuffled);
                                        setActionMoodId(null);
                                    }}>
                                        <Ionicons name="shuffle" size={18} color={colors.text} />
                                        <Text style={[styles.dropLabel, { color: colors.text, fontSize: fonts.sm }]}>Shuffle</Text>
                                    </TouchableOpacity>

                                    {!selectedMood.isDefault && (
                                        <TouchableOpacity style={styles.dropItem} onPress={() => {
                                            setActionMoodId(null);
                                            handleDeleteMood(selectedMood.id, selectedMood.name);
                                        }}>
                                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                            <Text style={[styles.dropLabel, { color: colors.danger, fontSize: fonts.sm }]}>Delete Mood</Text>
                                        </TouchableOpacity>
                                    )}
                                </>
                            );
                        })()}
                    </View>
                </TouchableOpacity>
            </Modal>

            <SongList 
                tracks={filteredAndSortedTracks} 
                selectionMode={isSelectionMode}
                onSelectionModeChange={setIsSelectionMode}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
            />
        </View>
    );
};

// Helper inside file or export from utils
function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

export default SongsScreen;

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginTop: 4,
        zIndex: 100,
        elevation: 10,
        backgroundColor: 'transparent',
        borderBottomColor: "#2CAEC533",
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
    },
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
    menuBtn: { padding: 4 },
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
    moodChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    moodMenuSheet: {
        width: 200,
        paddingVertical: 8,
        elevation: 10,
    },
    modalBackdropTransparent: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
