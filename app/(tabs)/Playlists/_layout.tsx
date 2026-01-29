import { defaultStyles } from "@/styles";
import { Stack } from "expo-router";
import { View } from "react-native";
import { StackScreenOptions } from "../../../constants/_layout";

const PlaylistsScreenLayout = () => {
  return (
    <View style={defaultStyles.container}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            ...StackScreenOptions,
            headerTitle: "Playlists",
          }}
        />
      </Stack>
    </View>
  );
};

export default PlaylistsScreenLayout;
