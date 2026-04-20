import { SongList } from '@/components/SongList';
import { useTheme } from '@/constants/theme';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ArtistDetailScreen = () => {
    const { name } = useLocalSearchParams<{ name: string }>();
    const { tracks } = useLibraryStore();
    const { play } = usePlayerStore();
    const { colors, fonts, spacing, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const artistTracks = useMemo(() => {
        return tracks.filter(t => t.artist === name);
    }, [tracks, name]);

    const totalDuration = useMemo(() => {
        const secs = artistTracks.reduce((sum, t) => sum + (t.duration || 0), 0);
        return Math.floor(secs / 60);
    }, [artistTracks]);

    const handlePlayAll = () => {
        if (artistTracks.length > 0) {
            play(artistTracks[0], artistTracks, `artist-${name}`);
        }
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)/Artists');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={[styles.header, {
                paddingHorizontal: spacing.horizontal,
                paddingTop: insets.top,
                height: 60 + insets.top
            }]}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{name}</Text>
                <TouchableOpacity style={styles.menuBtn}>
                    <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Artist Info Card */}
            <View style={[styles.infoCard, { paddingHorizontal: spacing.horizontal }]}>
                <View style={[styles.avatarContainer, { backgroundColor: colors.backgroundLight }]}>
                    <Ionicons name="person" size={48} color={colors.primary} />
                </View>
                <View style={styles.statsContainer}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{artistTracks.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Songs</Text>
                </View>
                <View style={styles.statsContainer}>
                    <Text style={[styles.statValue, { color: colors.text }]}>{totalDuration}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>Minutes</Text>
                </View>
                <TouchableOpacity
                    style={[styles.playBtn, { backgroundColor: colors.primary }]}
                    onPress={handlePlayAll}
                >
                    <Ionicons name="play" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Song List */}
            <SongList tracks={artistTracks} contextId={`artist-${name}`} />
        </View>
    );
};

export default ArtistDetailScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
    },
    backBtn: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
    },
    menuBtn: {
        padding: 4,
        marginRight: -4,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    },
    playBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
});
