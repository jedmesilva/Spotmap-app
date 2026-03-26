import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import COLORS from "@/constants/colors";
import { useGame } from "@/context/GameContext";

interface UserProfileHUDProps {
  insets: { top: number };
}

function getHealthColor(health: number, maxHealth: number): string {
  const ratio = maxHealth > 0 ? health / maxHealth : 1;
  if (ratio > 0.6) return COLORS.dark.spotMoney;
  if (ratio > 0.3) return COLORS.dark.warning;
  return COLORS.dark.danger;
}

export function UserProfileHUD({ insets }: UserProfileHUDProps) {
  const { userProfile } = useGame();

  const top = Math.max(insets.top + 10, 50);
  const healthRatio = userProfile.maxHealth > 0
    ? userProfile.health / userProfile.maxHealth
    : 1;
  const healthColor = getHealthColor(userProfile.health, userProfile.maxHealth);

  return (
    <View style={[styles.row, { top }]}>
      <TouchableOpacity
        style={[styles.avatar, { borderColor: healthColor }]}
        onPress={() => router.push("/account")}
        activeOpacity={0.8}
      >
        <Text style={styles.avatarText}>{userProfile.avatar}</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Ionicons name="heart" size={14} color={healthColor} />
        <View style={styles.healthInfo}>
          <Text style={[styles.healthText, { color: healthColor }]}>
            {userProfile.health}
            <Text style={styles.healthMax}>/{userProfile.maxHealth}</Text>
          </Text>
          <View style={styles.healthBar}>
            <View
              style={[
                styles.healthFill,
                {
                  width: `${Math.max(0, Math.min(100, healthRatio * 100))}%` as any,
                  backgroundColor: healthColor,
                },
              ]}
            />
          </View>
        </View>
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
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.dark.bgSecondary,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.dark.text,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  healthInfo: {
    gap: 3,
  },
  healthText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    lineHeight: 14,
  },
  healthMax: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.dark.textMuted,
  },
  healthBar: {
    width: 64,
    height: 3,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 2,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    borderRadius: 2,
  },
});
