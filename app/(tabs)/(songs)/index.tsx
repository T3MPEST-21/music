import TrackList from "@/components/TrackList";
import { colors } from "@/constants/theme";
import { useLogLibrary } from "@/hooks/useLogLibrary";
import { defaultStyles } from "@/styles";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { hp } from "../../../helpers/common";

export default function SongsScreen() {
  const { refreshLibrary, isLoading } = useLogLibrary();

  useEffect(() => {
    refreshLibrary();
  }, [refreshLibrary]);

  return (
    <View style={[defaultStyles.container, styles.container]}>
      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <TrackList />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: hp(2),
    paddingBottom: hp(7),
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
