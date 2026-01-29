import { colors, fonts } from "@/constants/theme";
import { Playlist } from "@/stores/library";
import { defaultStyles } from "@/styles";
import { Entypo, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";

interface PlaylistListItemProps {
  playlist: Playlist;
  onPress?: () => void;
}

const PlaylistListItem = ({ playlist, onPress }: PlaylistListItemProps) => {
  return (
    <TouchableHighlight onPress={onPress} underlayColor={colors.background}>
      <View style={styles.container}>
        <View style={styles.playlistIconContainer}>
          <MaterialCommunityIcons
            name="playlist-music"
            size={28}
            color={colors.textMuted}
          />
        </View>

        <View style={styles.infoContainer}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.playlistNameText}>
              {playlist.name}
            </Text>
            <Text numberOfLines={1} style={styles.trackCountText}>
              {playlist.tracks.length}{" "}
              {playlist.tracks.length === 1 ? "Track" : "Tracks"}
            </Text>
          </View>

          <Entypo name="chevron-thin-right" size={16} color={colors.icon} />
        </View>
      </View>
    </TouchableHighlight>
  );
};

export default PlaylistListItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    columnGap: 14,
    alignItems: "center",
  },
  playlistIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 12,
    paddingRight: 16,
  },
  playlistNameText: {
    ...defaultStyles.text,
    fontSize: fonts.sm,
    fontWeight: "600",
  },
  trackCountText: {
    ...defaultStyles.text,
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
});
