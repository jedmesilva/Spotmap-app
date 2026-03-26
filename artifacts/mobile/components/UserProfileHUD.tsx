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
  const displayName = isInspecting ? selectedUser.name : null;

  const healthColor = getHealthColor(displayHealth, displayMaxHealth);

  return (
    <View style={[styles.wrapper, { top }]}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.avatar,
            isInspecting && styles.avatarInspecting,
          ]}
          onPress={() => {
            if (!isInspecting) router.push("/account");
          }}
          activeOpacity={isInspecting ? 1 : 0.8}
        >
          <Text style={styles.avatarText}>{displayAvatar}</Text>
        </TouchableOpacity>

        <View style={[styles.card, isInspecting && styles.cardInspecting]}>
          <Ionicons name="heart" size={16} color={healthColor} />
          <Text style={[styles.healthText, { color: healthColor }]}>
            {displayHealth}
          </Text>
        </View>

        {isInspecting && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => selectUser(null)}
            activeOpacity={0.75}
          >
            <Feather name="x" size={14} color={COLORS.dark.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {isInspecting && displayName && (
        <View style={styles.inspectingBanner}>
          <Feather name="eye" size={9} color={COLORS.dark.warning} />
          <Text style={styles.inspectingText} numberOfLines={1}>
            {displayName}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  cardInspecting: {
    borderColor: COLORS.dark.warning + "55",
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
  healthText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dark.card,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    alignItems: "center",
    justifyContent: "center",
  },
  inspectingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.dark.warning + "18",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.dark.warning + "44",
    alignSelf: "flex-start",
  },
  inspectingText: {
    color: COLORS.dark.warning,
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
    maxWidth: 120,
  },
});
