import { useLibraryStore } from "@/stores/library";
import { defaultStyles } from "@/styles";
import React from "react";
import { FlatList, View } from "react-native";
import TrackPlayer, { Track } from "react-native-track-player";
import TrackListItem from "./TrackListItem";

const TrackList = ({ tracks: customTracks }: { tracks?: Track[] }) => {
  const { tracks: libraryTracks } = useLibraryStore();
  const tracks = customTracks || libraryTracks;

  const handleTrackSelect = async (selectedTrack: Track) => {
    await TrackPlayer.reset();
    await TrackPlayer.add(tracks);

    const index = tracks.findIndex((t) => t.url === selectedTrack.url);
    if (index !== -1) {
      await TrackPlayer.skip(index);
      await TrackPlayer.play();
    }
  };

  return (
    <View style={defaultStyles.container}>
      <FlatList
        data={tracks}
        contentContainerStyle={{
          paddingTop: 10,
          paddingBottom: 120,
          paddingHorizontal: 16,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        renderItem={({ item: track }) => (
          <TrackListItem track={track} onTrackSelect={handleTrackSelect} />
        )}
        keyExtractor={(item) => item.url}
      />
    </View>
  );
};

export default TrackList;
