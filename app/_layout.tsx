import { useSetupTrackPlayer } from "@/hooks/useSetupTrackPlayer";
import { PlaybackService } from "@/services/playbackService";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import TrackPlayer from "react-native-track-player";

TrackPlayer.registerPlaybackService(() => PlaybackService);

const App = () => {
  useSetupTrackPlayer({ onLoad: () => console.log("Player ready") });

  return (
    <SafeAreaProvider>
      <RootNavigation />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
};

export function RootNavigation() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default App;
