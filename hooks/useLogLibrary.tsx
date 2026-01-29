import { useLibraryStore } from "@/stores/library";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useState } from "react";
import { Image } from "react-native";

const unknownTrackImage = Image.resolveAssetSource(
  require("@/assets/images/unknown-track.png"),
).uri;

export const useLogLibrary = () => {
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const { tracks, setTracks } = useLibraryStore();
  const [isLoading, setIsLoading] = useState(false);

  const refreshLibrary = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!permissionResponse?.granted) {
        const permission = await requestPermission();
        if (!permission.granted) return;
      }

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 1000, // Fetch first 1000 tracks
      });

      const mappedTracks = media.assets.map((asset) => ({
        url: asset.uri,
        title: asset.filename.replace(/\.mp3$/, ""),
        artist: "Unknown Artist", // expo-music-library doesn't give artist in basic query without specialized methods or separate calls which might slow it down. 'Unknown' for now as requested user for minimal checks.
        // Actually MediaLibrary asset might have artist? Nope, just filename/duration usually.
        artwork: unknownTrackImage,
        rating: 0,
        playlist: [],
      }));

      // Basic cleanup of title
      // If filename is "Artist - Song.mp3", we could parse it, but let's keep it simple "minimalist".

      setTracks(mappedTracks);
    } catch (error) {
      console.error("Error fetching library", error);
    } finally {
      setIsLoading(false);
    }
  }, [permissionResponse, requestPermission, setTracks]);

  return {
    tracks,
    refreshLibrary,
    isLoading,
    permissionResponse,
  };
};
