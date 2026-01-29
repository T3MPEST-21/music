import { defaultStyles } from "@/styles";
import { Stack } from "expo-router";
import { View } from "react-native";
import { StackScreenOptions } from "../../../constants/_layout";

const SongScreenLayout = () => {
  return (
    <View style={defaultStyles.container}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            ...StackScreenOptions,
            headerTitle: "Songs",
          }}
        />
      </Stack>
    </View>
  );
};

export default SongScreenLayout;
