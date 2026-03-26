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
    <View style={[styles.container, { top }]}>
      <View style={styles.avatarRing}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{userProfile.avatar}</Text>
        </View>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>{userProfile.level}</Text>
        </View>
      </View>
      <Text style={styles.name}>{userProfile.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.dark.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    zIndex: 10,
    shadowColor: COLORS.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarRing: {
    position: "relative",
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
  levelBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.dark.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.dark.bg,
  },
  levelText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.bg,
  },
  name: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.text,
  },
});
