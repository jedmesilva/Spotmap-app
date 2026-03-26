import { Feather, Ionicons } from "@expo/vector-icons";
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
  const { userProfile, selectedUser, selectUser } = useGame();

  const top = Math.max(insets.top + 10, 50);
  const isInspecting = selectedUser !== null;

  const displayHealth = isInspecting ? selectedUser.health : userProfile.health;
  const displayMaxHealth = isInspecting ? selectedUser.maxHealth : userProfile.maxHealth;
  const displayAvatar = isInspecting ? selectedUser.avatar : userProfile.avatar;

  const healthColor = getHealthColor(displayHealth, displayMaxHealth);

  return (
    <View style={[styles.row, { top }]}>
      <TouchableOpacity
        style={[styles.avatar, isInspecting && styles.avatarInspecting]}
        onPress={() => { if (!isInspecting) router.push("/account"); }}
        activeOpacity={isInspecting ? 1 : 0.8}
      >
        <Text style={styles.avatarText}>{displayAvatar}</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Ionicons name="heart" size={16} color={healthColor} />
        <Text style={[styles.healthText, { color: healthColor }]}>
          {displayHealth}
        </Text>
      </View>

      {isInspecting && (
        <>
          <Text style={styles.inspectName} numberOfLines={1}>
            {selectedUser.name}
          </Text>
          <TouchableOpacity
            onPress={() => selectUser(null)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="x" size={16} color={COLORS.dark.textMuted} />
          </TouchableOpacity>
        </>
      )}
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
  avatarInspecting: {
    borderColor: COLORS.dark.warning,
  },
  avatarText: {
    color: COLORS.dark.text,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
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
  healthText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  inspectName: {
    color: COLORS.dark.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    maxWidth: 100,
  },
});
