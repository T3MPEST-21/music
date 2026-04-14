import { useTheme } from "@/constants/theme";
import { usePlayerStore } from "@/stores/playerStore";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export const GlobalBackground = () => {
    const { backgroundStyle, glassIntensity, isDark } = useTheme();
    const { activeTrack } = usePlayerStore();

    if (backgroundStyle === 'solid') return null;

    const artworkUrl = activeTrack?.artwork;

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Base Background (Black/Dark) */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#000' : '#fff' }]} />

            {/* Artwork Blur Layer */}
            {artworkUrl && (
                <Animated.View 
                    entering={FadeIn.duration(800)} 
                    exiting={FadeOut.duration(800)}
                    style={StyleSheet.absoluteFill}
                >
                    <Image
                        source={{ uri: artworkUrl }}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                        transition={600}
                    />
                    <BlurView
                        intensity={glassIntensity * 100}
                        tint={isDark ? "dark" : "light"}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            )}

            {/* Mesh Overlay (Simulated with Gradient or Vignette if needed) */}
            {backgroundStyle === 'mesh' && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.2)' }]} />
            )}

            {/* Standard Dark/Light Overlay for Readability */}
            <View 
                style={[
                    StyleSheet.absoluteFill, 
                    { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)' }
                ]} 
            />
        </View>
    );
};
