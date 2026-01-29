import { FloatingPlayer } from "@/components/FloatingPlayer";
import { colors, fonts } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";

const TabNav = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: fonts.xs,
            fontWeight: "500",
          },
          tabBarStyle: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            position: "absolute",
            borderTopWidth: 0,
            paddingTop: 8,
            paddingBottom: 10,
            height: 60,
            backgroundColor: "rgba(25, 25, 25, 0.98)",
          },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="Playlists"
          options={{
            title: "",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name="home"
                size={24}
                color={focused ? colors.primary : colors.textMuted}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="Favorites"
          options={{
            title: "",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name="heart"
                size={24}
                color={focused ? colors.primary : colors.textMuted}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="(songs)"
          options={{
            title: "",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name="musical-note"
                size={24}
                color={focused ? colors.primary : colors.textMuted}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="Artists"
          options={{
            title: "",
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name="person"
                size={24}
                color={focused ? colors.primary : colors.textMuted}
              />
            ),
          }}
        />
      </Tabs>

      <FloatingPlayer />
    </>
  );
};

export default TabNav;

const styles = StyleSheet.create({});
