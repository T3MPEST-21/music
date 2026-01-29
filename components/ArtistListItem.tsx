import { colors, fonts } from "@/constants/theme";
import { defaultStyles } from "@/styles";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableHighlight, View } from "react-native";

export type Artist = {
  name: string;
  tracksCount: number;
  artwork?: string;
};

interface ArtistListItemProps {
  artist: Artist;
  onPress?: () => void;
}

const ArtistListItem = ({ artist, onPress }: ArtistListItemProps) => {
  return (
    <TouchableHighlight onPress={onPress} underlayColor={colors.background}>
      <View style={styles.container}>
        <View style={styles.artistIconContainer}>
          <Ionicons name="person" size={24} color={colors.textMuted} />
        </View>

        <View style={styles.infoContainer}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.artistNameText}>
              {artist.name}
            </Text>
            <Text numberOfLines={1} style={styles.trackCountText}>
              {artist.tracksCount}{" "}
              {artist.tracksCount === 1 ? "Track" : "Tracks"}
            </Text>
          </View>

          <Entypo name="chevron-thin-right" size={16} color={colors.icon} />
        </View>
      </View>
    </TouchableHighlight>
  );
};

export default ArtistListItem;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    columnGap: 14,
    alignItems: "center",
  },
  artistIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  artistNameText: {
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
