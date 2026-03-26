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
  const healthRatio = displayMaxHealth > 0 ? displayHealth / displayMaxHealth : 1;

  return (
    <View style={[styles.row, { top }]}>
      <TouchableOpacity
        style={[styles.avatar, isInspecting && styles.avatarInspecting]}
        onPress={() => { if (!isInspecting) router.push("/account"); }}
        activeOpacity={isInspecting ? 1 : 0.8}
      >
        <Text style={styles.avatarText}>{displayAvatar}</Text>
      </TouchableOpacity>

      {isInspecting ? (
        <View style={styles.inspectCard}>
          <View style={styles.inspectCardTop}>
            <Text style={styles.inspectName} numberOfLines={1}>
              {selectedUser.name}
            </Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => selectUser(null)}
              activeOpacity={0.75}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Feather name="x" size={12} color={COLORS.dark.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inspectCardBottom}>
            <Ionicons name="heart" size={12} color={healthColor} />
            <Text style={[styles.healthText, styles.healthTextSmall, { color: healthColor }]}>
              {displayHealth}
            </Text>
            <View style={styles.healthBarTrack}>
              <View
                style={[
                  styles.healthBarFill,
                  { width: `${Math.round(healthRatio * 100)}%` as any, backgroundColor: healthColor },
                ]}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Ionicons name="heart" size={16} color={healthColor} />
          <Text style={[styles.healthText, { color: healthColor }]}>
            {displayHealth}
          </Text>
        </View>
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
  inspectCard: {
    backgroundColor: COLORS.dark.card,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: COLORS.dark.warning + "55",
    gap: 4,
    minWidth: 110,
    maxWidth: 160,
  },
  inspectCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  inspectName: {
    color: COLORS.dark.text,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  closeBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  inspectCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  healthText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  healthTextSmall: {
    fontSize: 12,
  },
  healthBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.dark.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  healthBarFill: {
    height: 4,
    borderRadius: 2,
  },
});
