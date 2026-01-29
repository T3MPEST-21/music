import { defaultStyles } from "@/styles";
import { Stack } from "expo-router";
import { View } from "react-native";
import { StackScreenOptions } from "../../../constants/_layout";

const ArtistsScreenLayout = () => {
  return (
    <View style={defaultStyles.container}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            ...StackScreenOptions,
            headerTitle: "Artists",
          }}
        />
      </Stack>
    </View>
  );
};

export default ArtistsScreenLayout;
