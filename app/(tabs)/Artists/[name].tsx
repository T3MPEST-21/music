import TrackList from "@/components/TrackList";
import { colors } from "@/constants/theme";
import { useLibraryStore } from "@/stores/library";
import { defaultStyles } from "@/styles";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { hp } from "../../../helpers/common";

const ArtistDetailScreen = () => {
  const { name } = useLocalSearchParams();
  const artistName = decodeURIComponent(name as string);
  const { tracks } = useLibraryStore();

  const artistTracks = useMemo(() => {
    return tracks.filter(
      (track) => (track.artist || "Unknown Artist") === artistName,
    );
  }, [tracks, artistName]);

  return (
    <View style={[defaultStyles.container, styles.container]}>
      <Stack.Screen
        options={{
          headerTitle: artistName,
          headerShown: true,
          headerTintColor: colors.primary,
          headerBackTitle: "Artists",
        }}
      />
      <TrackList tracks={artistTracks} />
    </View>
  );
};

export default ArtistDetailScreen;

const styles = StyleSheet.create({
  container: {
    paddingTop: hp(2),
  },
});
