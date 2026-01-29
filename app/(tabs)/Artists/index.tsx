import ArtistListItem from "@/components/ArtistListItem";
import { useLibraryStore } from "@/stores/library";
import { defaultStyles } from "@/styles";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { hp } from "../../../helpers/common";

const ArtistsScreen = () => {
  const { tracks } = useLibraryStore();
  const router = useRouter();

  const artists = useMemo(() => {
    return tracks
      .reduce((acc, track) => {
        const artistName = track.artist || "Unknown Artist";
        const existingArtist = acc.find((a) => a.name === artistName);

        if (existingArtist) {
          existingArtist.tracksCount += 1;
        } else {
          acc.push({
            name: artistName,
            tracksCount: 1,
            artwork: track.artwork, // Use the first track's artwork as artist artwork
          });
        }
        return acc;
      }, [] as any[])
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [tracks]);

  return (
    <View style={[defaultStyles.container, styles.container]}>
      <FlatList
        data={artists}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 120,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item: artist }) => (
          <ArtistListItem
            artist={artist}
            onPress={() =>
              router.push(`/Artists/${encodeURIComponent(artist.name)}`)
            }
          />
        )}
        keyExtractor={(item) => item.name}
      />
    </View>
  );
};

export default ArtistsScreen;

const styles = StyleSheet.create({
  container: {
    paddingTop: hp(2),
  },
});
