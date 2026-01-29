import { colors, fonts } from "@/constants/theme";
import { StyleSheet } from "react-native";

export const defaultStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    text: {
        fontSize: fonts.md,
        color: colors.text,
    }
})

export const utilsStyles = StyleSheet.create({
    
})