import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";

import COLORS from "@/constants/colors";
import { useGame } from "@/context/GameContext";

interface UserProfileHUDProps {
  insets: { top: number };
}

export function UserProfileHUD({ insets }: UserProfileHUDProps) {
  const { userProfile } = useGame();

  const healthPercent = userProfile.health / userProfile.maxHealth;
  const xpToNext = 3000;
  const xpPercent = userProfile.xp / xpToNext;
  const healthColor =
    healthPercent > 0.6
      ? COLORS.dark.accent
      : healthPercent > 0.3
      ? COLORS.dark.warning
      : COLORS.dark.danger;

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

      <View style={styles.info}>
        <Text style={styles.name}>{userProfile.name}</Text>
        <View style={styles.healthRow}>
          <Feather name="heart" size={10} color={healthColor} />
          <View style={styles.healthTrack}>
            <View
              style={[
                styles.healthFill,
                {
                  width: `${healthPercent * 100}%`,
                  backgroundColor: healthColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.healthNum, { color: healthColor }]}>
            {userProfile.health}
          </Text>
        </View>
        <View style={styles.xpRow}>
          <Feather name="star" size={10} color={COLORS.dark.spotCoupon} />
          <View style={styles.xpTrack}>
            <View
              style={[
                styles.xpFill,
                { width: `${xpPercent * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.xpNum}>{userProfile.xp} XP</Text>
        </View>
      </View>
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
    maxWidth: 200,
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
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.text,
  },
  healthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  healthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 2,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    borderRadius: 2,
  },
  healthNum: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
  },
  xpRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  xpTrack: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 2,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    backgroundColor: COLORS.dark.spotCoupon,
    borderRadius: 2,
  },
  xpNum: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.dark.textMuted,
  },
});
