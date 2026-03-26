import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import COLORS from "@/constants/colors";
import { useGame, isMonsterMode, STRENGTH_MONSTER_THRESHOLD } from "@/context/GameContext";

interface UserProfileHUDProps {
  insets: { top: number };
}

function getHealthColor(health: number, maxHealth: number): string {
  const ratio = maxHealth > 0 ? health / maxHealth : 1;
  if (ratio > 0.6) return COLORS.dark.spotMoney;
  if (ratio > 0.3) return COLORS.dark.warning;
  return COLORS.dark.danger;
}

function getStrengthColor(strength: number): string {
  if (strength >= STRENGTH_MONSTER_THRESHOLD) return "#ff6b00";
  if (strength >= 150) return "#c084fc";
  if (strength >= 100) return "#60a5fa";
  if (strength >= 50) return "#94a3b8";
  return COLORS.dark.danger;
}

export function UserProfileHUD({ insets }: UserProfileHUDProps) {
  const { userProfile, selectedUser } = useGame();

  const top = Math.max(insets.top + 10, 50);
  const isInspecting = selectedUser !== null;

  const displayHealth = isInspecting ? selectedUser.health : userProfile.health;
  const displayMaxHealth = isInspecting ? selectedUser.maxHealth : userProfile.maxHealth;
  const displayAvatar = isInspecting ? selectedUser.avatar : userProfile.avatar;
  const displayStrength = isInspecting ? selectedUser.strength : userProfile.strength;

  const healthColor = getHealthColor(displayHealth, displayMaxHealth);
  const strengthColor = getStrengthColor(displayStrength);
  const monsterMode = isMonsterMode(displayStrength);

  return (
    <View style={[styles.row, { top }]}>
      <TouchableOpacity
        style={[styles.avatar, monsterMode && !isInspecting && styles.avatarMonster]}
        onPress={() => { if (!isInspecting) router.push("/account"); }}
        activeOpacity={isInspecting ? 1 : 0.8}
      >
        <Text style={styles.avatarText}>{displayAvatar}</Text>
        {monsterMode && !isInspecting && (
          <View style={styles.monsterBadge} />
        )}
      </TouchableOpacity>

      <View style={styles.card}>
        <Ionicons name="heart" size={14} color={healthColor} />
        <Text style={[styles.statText, { color: healthColor }]}>
          {displayHealth}
        </Text>

        <View style={styles.divider} />

        <Ionicons name="flash" size={14} color={strengthColor} />
        <Text style={[styles.statText, { color: strengthColor }]}>
          {Math.round(displayStrength)}
        </Text>
      </View>

      {isInspecting && (
        <Text style={styles.inspectName} numberOfLines={1}>
          {selectedUser.name}
        </Text>
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
  avatarMonster: {
    borderColor: "#ff6b00",
    shadowColor: "#ff6b00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
  },
  monsterBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ff6b00",
  },
  avatarText: {
    color: COLORS.dark.text,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.dark.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  divider: {
    width: 1,
    height: 14,
    backgroundColor: COLORS.dark.border,
    marginHorizontal: 2,
  },
  statText: {
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
