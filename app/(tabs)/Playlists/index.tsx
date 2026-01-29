import PlaylistListItem from "@/components/PlaylistListItem";
import { colors } from "@/constants/theme";
import { useLibraryStore } from "@/stores/library";
import { defaultStyles } from "@/styles";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { hp } from "../../../helpers/common";

const PlaylistsScreen = () => {
  const { playlists, createPlaylist } = useLibraryStore();
  const router = useRouter();

  const handleCreatePlaylist = () => {
    Alert.prompt(
      "New Playlist",
      "Enter a name for your playlist",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create",
          onPress: (name: string | undefined) => {
            if (name) createPlaylist(name);
          },
        },
      ],
      "plain-text",
    );
  };

  return (
    <View style={[defaultStyles.container, styles.container]}>
      <FlatList
        data={playlists}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreatePlaylist}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
            <Text style={[defaultStyles.text, { color: colors.primary }]}>
              Create New Playlist
            </Text>
          </TouchableOpacity>
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 120,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item: playlist }) => (
          <PlaylistListItem
            playlist={playlist}
            onPress={() =>
              router.push(`/Playlists/${encodeURIComponent(playlist.name)}`)
            }
          />
        )}
        keyExtractor={(item) => item.name}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={defaultStyles.text}>No playlists created yet</Text>
          </View>
        }
      />
    </View>
  );
};

export default PlaylistsScreen;

const styles = StyleSheet.create({
  container: {
    paddingTop: hp(2),
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 10,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
  },
});
