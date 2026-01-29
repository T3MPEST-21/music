import { colors } from "@/constants/theme";
import { defaultStyles } from "@/styles";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import TrackPlayer, {
    useActiveTrack,
    useIsPlaying,
} from "react-native-track-player";

export const FloatingPlayer = () => {
  const activeTrack = useActiveTrack();
  const { playing } = useIsPlaying();

  if (!activeTrack) return null;

  const handlePlayPause = () => {
    if (playing) {
      TrackPlayer.pause();
    } else {
      TrackPlayer.play();
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.container}>
      <Image
        source={{ uri: activeTrack.artwork ?? "https://placehold.co/40x40" }}
        style={styles.artwork}
      />

      <View style={styles.trackInfo}>
        <Text numberOfLines={1} style={styles.title}>
          {activeTrack.title}
        </Text>
        <Text numberOfLines={1} style={styles.artist}>
          {activeTrack.artist || "Unknown Artist"}
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={() => TrackPlayer.skipToPrevious()}>
          <Ionicons name="play-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePlayPause}>
          <Ionicons
            name={playing ? "pause" : "play"}
            size={30}
            color={colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => TrackPlayer.skipToNext()}>
          <Ionicons name="play-forward" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(25, 25, 25, 0.95)",
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 8,
    position: "absolute",
    bottom: 80, // Above the tab bar
    left: 0,
    right: 0,
    ...defaultStyles.text,
  },
  artwork: {
    width: 45,
    height: 45,
    borderRadius: 8,
  },
  trackInfo: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "bold",
  },
  artist: {
    color: colors.textMuted,
    fontSize: 12,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 20,
    paddingHorizontal: 10,
  },
});
