import { colors, fonts } from "@/constants/theme";
import { useLibraryStore } from "@/stores/library";
import { defaultStyles } from "@/styles";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableHighlight,
    TouchableOpacity,
    View,
} from "react-native";
import { Track, useActiveTrack } from "react-native-track-player";

interface TrackListItemProps {
  track: Track;
  onTrackSelect?: (track: Track) => void;
}

const TrackListItem = ({
  track,
  onTrackSelect: onTrackSelect,
}: TrackListItemProps) => {
  const activeTrack = useActiveTrack();
  const isActiveTrack = activeTrack?.url === track.url;

  const { favorites, toggleFavorite } = useLibraryStore();
  const isFavorite = favorites.includes(track.url);

  return (
    <TouchableHighlight
      onPress={() => onTrackSelect?.(track)}
      underlayColor={colors.background}
    >
      <View style={styles.trackItemContainer}>
        <View>
          <Image
            source={{ uri: track.artwork ?? "https://placehold.co/50x50" }}
            style={{
              ...styles.trackArtworkImage,
              opacity: isActiveTrack ? 0.6 : 1,
            }}
          />
          {isActiveTrack && (
            <View style={styles.activeTrackIndicator}>
              <Ionicons name="play" size={18} color={colors.primary} />
            </View>
          )}
        </View>

        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Track Info */}
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                ...styles.trackTitleText,
                color: isActiveTrack ? colors.primary : colors.text,
              }}
            >
              {track.title}
            </Text>

            {track.artist && (
              <Text numberOfLines={1} style={styles.trackArtistText}>
                {track.artist}
              </Text>
            )}
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              columnGap: 16,
            }}
          >
            {/* Favorite toggle */}
            <TouchableHighlight
              onPress={(e) => {
                e.stopPropagation();
                toggleFavorite(track);
              }}
              underlayColor="transparent"
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={20}
                color={isFavorite ? colors.primary : colors.icon}
              />
            </TouchableHighlight>

            {/* Options */}
            <TouchableOpacity
              onPress={() => {
                const { playlists, addTrackToPlaylist } =
                  useLibraryStore.getState();
                if (playlists.length === 0) {
                  Alert.alert(
                    "No Playlists",
                    "Create a playlist first in the Playlists tab.",
                  );
                  return;
                }

                Alert.alert("Add to Playlist", "Select a playlist", [
                  ...playlists.map((p) => ({
                    text: p.name,
                    onPress: () => addTrackToPlaylist(track, p.name),
                  })),
                  { text: "Cancel", style: "cancel" as const },
                ]);
              }}
            >
              <Entypo
                name="dots-three-horizontal"
                size={18}
                color={colors.icon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableHighlight>
  );
};

export default TrackListItem;

const styles = StyleSheet.create({
  trackItemContainer: {
    flexDirection: "row",
    columnGap: 14,
    alignItems: "center",
    paddingRight: 20,
  },
  trackArtworkImage: {
    borderRadius: 8,
    width: 50,
    height: 50,
  },
  activeTrackIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
  },
  trackTitleText: {
    ...defaultStyles.text,
    fontSize: fonts.sm,
    fontWeight: "600",
  },
  trackArtistText: {
    ...defaultStyles.text,
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
});
