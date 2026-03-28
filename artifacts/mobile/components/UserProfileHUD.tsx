import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import COLORS from "@/constants/colors";
import { useGame, isMonsterMode, STRENGTH_MONSTER_THRESHOLD } from "@/context/GameContext";

const isImageUrl = (v: string) => v.startsWith("http://") || v.startsWith("https://");

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

const SPOT_COLORS: Record<string, string> = {
  coupon: COLORS.dark.spotCoupon,
  money: COLORS.dark.spotMoney,
  product: COLORS.dark.spotProduct,
  rare: COLORS.dark.spotRare,
};

const SPOT_ICONS: Record<string, string> = {
  coupon: "tag",
  money: "dollar-sign",
  product: "box",
  rare: "star",
};

const SPOT_LABELS: Record<string, string> = {
  coupon: "Cupom",
  money: "Dinheiro",
  product: "Produto",
  rare: "Raro",
};

function formatExpiry(ts: number) {
  const diff = ts - Date.now();
  if (diff <= 0) return "Expirado";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function UserProfileHUD({ insets }: UserProfileHUDProps) {
  const { userProfile, selectedUser, selectedSpot } = useGame();

  const top = Math.max(insets.top + 10, 50);

  if (selectedSpot) {
    const color = SPOT_COLORS[selectedSpot.type] ?? COLORS.dark.accent;
    const icon = SPOT_ICONS[selectedSpot.type] ?? "star";
    const label = SPOT_LABELS[selectedSpot.type] ?? selectedSpot.type;

    return (
      <View style={[styles.row, { top }]}>
        <View style={[styles.avatar, { borderColor: color }]}>
          <View style={[styles.spotIconBg, { backgroundColor: color + "22" }]}>
            <Feather name={icon as any} size={18} color={color} />
          </View>
        </View>

        <View style={[styles.card, { borderColor: color + "44" }]}>
          <Feather name="map-pin" size={13} color={color} />
          <Text style={[styles.statText, { color }]}>{selectedSpot.radius}m</Text>

          {selectedSpot.expiresAt && (
            <>
              <View style={styles.divider} />
              <Feather name="clock" size={13} color={COLORS.dark.textMuted} />
              <Text style={[styles.statText, { color: COLORS.dark.textMuted }]}>
                {formatExpiry(selectedSpot.expiresAt)}
              </Text>
            </>
          )}
        </View>

        <View style={styles.spotNameBlock}>
          <Text style={styles.spotName} numberOfLines={1}>{selectedSpot.title}</Text>
          <Text style={[styles.spotValue, { color }]}>{selectedSpot.value}</Text>
        </View>
      </View>
    );
  }

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
        {isImageUrl(displayAvatar) ? (
          <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarText}>{displayAvatar}</Text>
        )}
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
    overflow: "hidden",
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
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  spotIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  spotNameBlock: {
    flexDirection: "column",
    gap: 1,
    maxWidth: 140,
  },
  spotName: {
    color: COLORS.dark.text,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    lineHeight: 16,
  },
  spotValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 15,
  },
});
