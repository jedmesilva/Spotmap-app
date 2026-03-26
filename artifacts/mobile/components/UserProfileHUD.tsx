import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import COLORS from "@/constants/colors";
import { useGame } from "@/context/GameContext";

interface UserProfileHUDProps {
  insets: { top: number };
}

export function UserProfileHUD({ insets }: UserProfileHUDProps) {
  const { userProfile } = useGame();

  const top = Math.max(insets.top + 10, 50);

  return (
    <View style={[styles.row, { top }]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{userProfile.avatar}</Text>
      </View>

      <View style={styles.card}>
        <Ionicons name="heart" size={16} color={COLORS.dark.danger} />
        <Text style={styles.healthText}>{userProfile.health}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.dark.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    shadowColor: COLORS.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.dark.bgSecondary,
    borderWidth: 2,
    borderColor: COLORS.dark.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.dark.text,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  healthText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.danger,
  },
});
