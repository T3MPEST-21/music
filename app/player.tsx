import { useTheme } from '@/constants/theme';
import { usePlayerStore } from '@/stores/playerStore';
import { Ionicons } from '@expo/vector-icons';
import { QueueModal } from '@/components/QueueModal';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrackPlayer, { useActiveTrack, useProgress } from 'react-native-track-player';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Simple seek bar with premium look
const SeekBar = ({
    position,
    duration,
    onSeek,
}: {
    position: number;
    duration: number;
    onSeek: (val: number) => void;
}) => {
    const { colors } = useTheme();
    const trackRef = useRef<View>(null);
    const layoutRef = useRef({ pageX: 0, width: 1 });
    const durationRef = useRef(duration);
    const onSeekRef = useRef(onSeek);
    durationRef.current = duration;
    onSeekRef.current = onSeek;

    const [isDragging, setIsDragging] = useState(false);
    const [dragRatio, setDragRatio] = useState(0);

    const getRatioFromPageX = (pageX: number) => {
        const { pageX: trackX, width } = layoutRef.current;
        const w = width > 0 ? width : 1;
        return Math.max(0, Math.min(1, (pageX - trackX) / w));
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (e) => {
                setIsDragging(true);
                setDragRatio(getRatioFromPageX(e.nativeEvent.pageX));
            },
            onPanResponderMove: (e) => {
                setDragRatio(getRatioFromPageX(e.nativeEvent.pageX));
            },
            onPanResponderRelease: (e) => {
                const ratio = getRatioFromPageX(e.nativeEvent.pageX);
                setIsDragging(false);
                onSeekRef.current(ratio * durationRef.current);
            },
        })
    ).current;

    const displayRatio = isDragging ? dragRatio : (duration > 0 ? position / duration : 0);

    return (
        <View
            ref={trackRef}
            onLayout={() => {
                trackRef.current?.measure((_fx, _fy, width, _height, pageX, _pageY) => {
                    layoutRef.current = { pageX, width };
                });
            }}
            style={seekBarStyles.track}
            {...panResponder.panHandlers}
        >
            <View style={[seekBarStyles.bg, { backgroundColor: colors.backgroundLight }]} />
            <View style={[seekBarStyles.fill, { backgroundColor: colors.primary, width: `${displayRatio * 100}%` }]} />
            <View style={[seekBarStyles.thumb, { backgroundColor: colors.text, left: `${displayRatio * 100}%` as any }]} />
        </View>
    );
};

const seekBarStyles = StyleSheet.create({
    track: {
        height: 30,
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
    },
    bg: {
        position: 'absolute',
        height: 3,
        width: '100%',
        borderRadius: 2,
        opacity: 0.3,
    },
    fill: {
        height: 3,
        borderRadius: 2,
    },
    thumb: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        top: 9,
        marginLeft: -6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
});

const PlayerScreen = () => {
    const { isPlaying, pause, resume, next, previous, toggleShuffle, toggleRepeat, repeatMode, isShuffleOn } = usePlayerStore();
    const activeTrack = useActiveTrack();
    const insets = useSafeAreaInsets();
    const { colors, fonts, cornerRadius, spacing, isDark } = useTheme();
    const { position, duration } = useProgress();
    const [showQueue, setShowQueue] = useState(false);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs} `;
    };

    const togglePlayback = () => {
        isPlaying ? pause() : resume();
    };

    const handleClose = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/(tabs)/(songs)');
        }
    };

    if (!activeTrack) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>No track playing</Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Immersive Background */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primary, opacity: 0.05 }]} />

            <View style={[styles.content, { paddingTop: insets.top, paddingHorizontal: spacing.horizontal }]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
                        <Ionicons name="chevron-down" size={32} color={colors.text} />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>NOW PLAYING</Text>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>SONIQUE</Text>
                    </View>
                    <TouchableOpacity style={styles.headerBtn}>
                        <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                {/* Artwork Area */}
                <View style={styles.artworkArea}>
                    <View style={[styles.artworkGlow, { backgroundColor: colors.primary }]} />
                    <View style={[styles.artworkCard, { backgroundColor: colors.card, borderRadius: 24 }]}>
                        <BlurView intensity={isDark ? 20 : 10} style={StyleSheet.absoluteFill} />
                        <Ionicons name="musical-note" size={140} color={colors.primary} style={{ opacity: 0.8 }} />
                    </View>
                </View>

                {/* Info */}
                <View style={styles.infoArea}>
                    <View style={styles.titleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.title, { color: colors.text, fontSize: 26 }]} numberOfLines={1}>
                                {activeTrack.title}
                            </Text>
                            <Text style={[styles.artist, { color: colors.textMuted, fontSize: 16 }]} numberOfLines={1}>
                                {activeTrack.artist || 'Unknown Artist'}
                            </Text>
                        </View>
                        <TouchableOpacity hitSlop={15}>
                            <Ionicons name="heart-outline" size={28} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Progress */}
                <View style={styles.progressArea}>
                    <SeekBar
                        position={position}
                        duration={duration}
                        onSeek={(val) => TrackPlayer.seekTo(val)}
                    />
                    <View style={styles.timeRow}>
                        <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(position)}</Text>
                        <Text style={[styles.timeText, { color: colors.textMuted }]}>{formatTime(duration)}</Text>
                    </View>
                </View>

                {/* Primary Controls */}
                <View style={styles.controlsArea}>
                    <TouchableOpacity onPress={toggleShuffle} style={styles.secondaryBtn}>
                        <Ionicons name="shuffle" size={22} color={isShuffleOn ? colors.primary : colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={previous} style={styles.primaryBtn}>
                        <Ionicons name="play-skip-back" size={34} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlayback} style={[styles.playBtn, { backgroundColor: colors.text }]}>
                        <Ionicons name={isPlaying ? "pause" : "play"} size={40} color={colors.background} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={next} style={styles.primaryBtn}>
                        <Ionicons name="play-skip-forward" size={34} color={colors.text} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={toggleRepeat} style={styles.secondaryBtn}>
                        <Ionicons name={repeatMode === 0 ? "repeat-outline" : "repeat"} size={22} color={repeatMode !== 0 ? colors.primary : colors.textMuted} />
                        {repeatMode === 1 && <View style={[styles.repeatOneDot, { backgroundColor: colors.primary }]} />}
                    </TouchableOpacity>
                </View>

                {/* Bottom Options */}
                <View style={[styles.bottomOptions, { marginBottom: Math.max(insets.bottom, 20) }]}>
                    <TouchableOpacity style={styles.optionBtn}>
                        <Ionicons name="share-outline" size={20} color={colors.textMuted} />
                        <Text style={[styles.optionLabel, { color: colors.textMuted }]}>Share</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.optionBtn} onPress={() => setShowQueue(true)}>
                        <Ionicons name="list" size={20} color={colors.textMuted} />
                        <Text style={[styles.optionLabel, { color: colors.textMuted }]}>Up Next</Text>
                    </TouchableOpacity>
                </View>

                <QueueModal visible={showQueue} onClose={() => setShowQueue(false)} />
            </View>
        </View>
    );
};

export default PlayerScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 60,
    },
    headerBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        alignItems: 'center',
    },
    headerSubtitle: {
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: 2,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    artworkArea: {
        flex: 1.2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    artworkCard: {
        width: SCREEN_WIDTH * 0.8,
        height: SCREEN_WIDTH * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
    },
    artworkGlow: {
        position: 'absolute',
        width: SCREEN_WIDTH * 0.6,
        height: SCREEN_WIDTH * 0.6,
        borderRadius: SCREEN_WIDTH * 0.3,
        opacity: 0.2,
        transform: [{ scale: 1.5 }],
        filter: 'blur(60px)',
    },
    infoArea: {
        marginVertical: 20,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    artist: {
        fontWeight: '500',
        marginTop: 4,
        opacity: 0.7,
    },
    progressArea: {
        marginBottom: 30,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    controlsArea: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 40,
    },
    playBtn: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    primaryBtn: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    secondaryBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    repeatOneDot: {
        position: 'absolute',
        bottom: 10,
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    bottomOptions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    optionLabel: {
        fontSize: 12,
        fontWeight: '700',
    },
});
