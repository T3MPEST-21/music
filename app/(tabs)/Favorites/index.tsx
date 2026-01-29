import TrackList from "@/components/TrackList";
import { useLibraryStore } from "@/stores/library";
import { defaultStyles } from "@/styles";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { hp } from "../../../helpers/common";

const FavoritesScreen = () => {
  const { tracks, favorites } = useLibraryStore();

  const favoriteTracks = useMemo(() => {
    return tracks.filter((track) => favorites.includes(track.url));
  }, [tracks, favorites]);

  return (
    <View style={[defaultStyles.container, styles.container]}>
      {favoriteTracks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={defaultStyles.text}>No favorites yet</Text>
        </View>
      ) : (
        <TrackList tracks={favoriteTracks} />
      )}
    </View>
  );
};

export default FavoritesScreen;

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
