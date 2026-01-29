import TrackList from "@/components/TrackList";
import { colors } from "@/constants/theme";
import { useLibraryStore } from "@/stores/library";
import { defaultStyles } from "@/styles";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { hp } from "../../../helpers/common";

const PlaylistDetailScreen = () => {
  const { name } = useLocalSearchParams();
  const playlistName = decodeURIComponent(name as string);
  const { tracks, playlists, deletePlaylist } = useLibraryStore();
  const router = useRouter();

  const playlist = useMemo(() => {
    return playlists.find((p) => p.name === playlistName);
  }, [playlists, playlistName]);

  const playlistTracks = useMemo(() => {
    if (!playlist) return [];
    return tracks.filter((track) => playlist.tracks.includes(track.url));
  }, [tracks, playlist]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlistName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deletePlaylist(playlistName);
            router.back();
          },
        },
      ],
    );
  };

  if (!playlist) return null;

  return (
    <View style={[defaultStyles.container, styles.container]}>
      <Stack.Screen
        options={{
          headerTitle: playlistName,
          headerShown: true,
          headerTintColor: colors.primary,
          headerBackTitle: "Playlists",
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      {playlistTracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={defaultStyles.text}>Empty Playlist</Text>
        </View>
      ) : (
        <TrackList tracks={playlistTracks} />
      )}
    </View>
  );
};

export default PlaylistDetailScreen;

const styles = StyleSheet.create({
  container: {
    paddingTop: hp(2),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
