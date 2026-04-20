import { useTheme } from '@/constants/theme';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import TrackPlayer, { useProgress } from 'react-native-track-player';

/**
 * Apollo Rule: Predictably Imperfect (Core Animated Implementation)
 * 
 * We use the standard React Native Animated API to ensure:
 * 1. Zero external complex runtimes (Reanimated) that could crash the bridge.
 * 2. Predictable performance on low-end "toaster-spec" devices.
 * 3. Simple, boring, and unbreakable logic.
 */
export const ProgressSlider = () => {
    const { position, duration } = useProgress(250); // High-res update for smoothness
    const { colors } = useTheme();
    
    // Core state
    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState(0);
    const containerWidth = useRef(0);
    
    // Animated values for visual smoothness
    const animProgress = useRef(new Animated.Value(0)).current;

    // Sync position to Animated Value when not dragging
    useEffect(() => {
        if (!isDragging && duration > 0) {
            Animated.timing(animProgress, {
                toValue: position / duration,
                duration: 250,
                useNativeDriver: false, // Width/Left can't use native driver, but it's safe for simple UI
            }).start();
        }
    }, [position, duration, isDragging]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // PanResponder for seeker logic
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (evt) => {
                setIsDragging(true);
                updateDragPos(evt.nativeEvent.locationX);
            },
            onPanResponderMove: (evt) => {
                updateDragPos(evt.nativeEvent.locationX);
            },
            onPanResponderRelease: (evt) => {
                const finalRatio = Math.max(0, Math.min(1, evt.nativeEvent.locationX / containerWidth.current));
                const seekTime = finalRatio * duration;
                
                TrackPlayer.seekTo(seekTime);
                setIsDragging(false);
            },
            onPanResponderTerminate: () => {
                setIsDragging(false);
            },
        })
    ).current;

    const updateDragPos = (locationX: number) => {
        const ratio = Math.max(0, Math.min(1, locationX / containerWidth.current));
        setDragPosition(ratio);
        animProgress.setValue(ratio);
    };

    // Visual styles
    const progressPercent = animProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.progressArea}>
            <View 
                style={styles.trackContainer}
                onLayout={(e) => {
                    containerWidth.current = e.nativeEvent.layout.width;
                }}
                {...panResponder.panHandlers}
            >
                <View style={[styles.trackBg, { backgroundColor: colors.backgroundLight }]} />
                <Animated.View 
                    style={[
                        styles.trackFill, 
                        { backgroundColor: colors.primary, width: progressPercent }
                    ]} 
                />
                <Animated.View 
                    style={[
                        styles.thumb, 
                        { backgroundColor: colors.text, left: progressPercent }
                    ]} 
                />
            </View>
            
            <View style={styles.timeRow}>
                <Text style={[styles.timeText, { color: colors.textMuted }]}>
                    {formatTime(isDragging ? dragPosition * duration : position)}
                </Text>
                <Text style={[styles.timeText, { color: colors.textMuted }]}>
                    {formatTime(duration)}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    progressArea: {
        marginBottom: 30,
        width: '100%',
    },
    trackContainer: {
        height: 40,
        justifyContent: 'center',
        position: 'relative',
        width: '100%',
    },
    trackBg: {
        position: 'absolute',
        height: 6,
        width: '100%',
        borderRadius: 3,
        opacity: 0.1,
    },
    trackFill: {
        height: 6,
        borderRadius: 3,
    },
    thumb: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        marginLeft: -8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
