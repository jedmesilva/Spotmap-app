import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useGame, isMonsterMode, STRENGTH_MONSTER_THRESHOLD } from "@/context/GameContext";

const isImageUrl = (v: string) => v.startsWith("http://") || v.startsWith("https://");

interface UserProfileHUDProps {
  insets: { top: number };
}

function getHealthColor(health: number, maxHealth: number, C: ReturnType<typeof useColors>): string {
  const ratio = maxHealth > 0 ? health / maxHealth : 1;
  if (ratio > 0.6) return C.spotMoney;
  if (ratio > 0.3) return C.warning;
  return C.danger;
}

function getStrengthColor(strength: number, C: ReturnType<typeof useColors>): string {
  if (strength >= STRENGTH_MONSTER_THRESHOLD) return "#ff6b00";
  if (strength >= 150) return "#c084fc";
  if (strength >= 100) return "#60a5fa";
  if (strength >= 50) return "#94a3b8";
  return C.danger;
}

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

function CollectBadge({ progress }: { progress: number | null }) {
  const C = useColors();
  const pct = progress !== null ? Math.round(progress) : null;
  return (
    <View style={[
      styles.badgeWrap,
      { borderColor: C.warning + "88", backgroundColor: C.bgSecondary },
    ]}>
      {pct !== null && (
        <View style={[styles.badgeFill, { width: `${pct}%` as any, backgroundColor: C.warning + "2A" }]} />
      )}
      <Text style={styles.badgeIcon}>⛏️</Text>
      <Text style={[styles.badgeText, { color: pct !== null ? C.warning : C.textMuted }]}>
        {pct !== null ? `${pct}%` : "—"}
      </Text>
    </View>
  );
}

function MinerCard({ avatar, progress, isPlayer = false }: { avatar: string; progress: number | null; isPlayer?: boolean }) {
  const C = useColors();
  return (
    <View style={styles.minerCard}>
      <View style={[styles.minerRing, {
        borderColor: isPlayer ? C.accent : C.warning + "88",
        backgroundColor: C.bgSecondary,
      }]}>
        {isImageUrl(avatar) ? (
          <Image source={{ uri: avatar }} style={styles.minerImg} />
        ) : (
          <Text style={styles.minerEmoji}>{avatar}</Text>
        )}
      </View>
      <CollectBadge progress={progress} />
    </View>
  );
}

export function UserProfileHUD({ insets }: UserProfileHUDProps) {
  const C = useColors();
  const { userProfile, selectedUser, selectedSpot, nearbyUsers, activeCollection } = useGame();

  const top = Math.max(insets.top + 10, 50);

  const SPOT_COLORS: Record<string, string> = {
    coupon: C.spotCoupon,
    money: C.spotMoney,
    product: C.spotProduct,
    rare: C.spotRare,
  };

  if (selectedSpot) {
    const color = SPOT_COLORS[selectedSpot.type] ?? C.accent;
    const icon = SPOT_ICONS[selectedSpot.type] ?? "star";
    const label = SPOT_LABELS[selectedSpot.type] ?? selectedSpot.type;

    const isPlayerMining = activeCollection?.spotId === selectedSpot.id;
    const playerProgress = isPlayerMining ? (activeCollection?.progress ?? 0) : 0;

    const otherMiners = nearbyUsers.filter(
      (u) => u.collectingSpotId === selectedSpot.id
    );

    return (
      <View style={[styles.spotBlock, { top }]}>
        <View style={[styles.spotImage, { borderColor: color, backgroundColor: color + "18" }]}>
          {selectedSpot.imageUrl ? (
            <Image source={{ uri: selectedSpot.imageUrl }} style={styles.spotImageFill} resizeMode="cover" />
          ) : (
            <Feather name={icon as any} size={28} color={color} />
          )}
          <View style={[styles.spotLabelBadge, { backgroundColor: color + "22", borderColor: color + "55" }]}>
            <Text style={[styles.spotLabelText, { color }]}>{label}</Text>
          </View>
        </View>

        <Text style={[styles.spotTitle, { color: C.text }]} numberOfLines={1}>{selectedSpot.title}</Text>
        <Text style={[styles.spotValue, { color }]} numberOfLines={1}>{selectedSpot.value}</Text>

        <View style={styles.spotMeta}>
          {selectedSpot.expiresAt && (
            <View style={styles.metaChip}>
              <Feather name="clock" size={10} color={C.textMuted} />
              <Text style={[styles.metaChipText, { color: C.textMuted }]}>{formatExpiry(selectedSpot.expiresAt)}</Text>
            </View>
          )}
          <View style={styles.metaChip}>
            <Feather name="map-pin" size={10} color={C.textMuted} />
            <Text style={[styles.metaChipText, { color: C.textMuted }]}>{selectedSpot.radius}m</Text>
          </View>
        </View>

        {(isPlayerMining || otherMiners.length > 0) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.minersScroll}
          >
            {isPlayerMining && (
              <MinerCard avatar={userProfile.avatar} progress={playerProgress} isPlayer />
            )}
            {otherMiners.map((u) => (
              <MinerCard key={u.id} avatar={u.avatar} progress={u.collectProgress} />
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  const isInspecting = selectedUser !== null;

  const displayHealth = isInspecting ? selectedUser.health : userProfile.health;
  const displayMaxHealth = isInspecting ? selectedUser.maxHealth : userProfile.maxHealth;
  const displayAvatar = isInspecting ? selectedUser.avatar : userProfile.avatar;
  const displayStrength = isInspecting ? selectedUser.strength : userProfile.strength;

  const healthColor = getHealthColor(displayHealth, displayMaxHealth, C);
  const strengthColor = getStrengthColor(displayStrength, C);
  const monsterMode = isMonsterMode(displayStrength);

  return (
    <View style={[styles.row, { top }]}>
      <TouchableOpacity
        style={[
          styles.avatar,
          { backgroundColor: C.bgSecondary, borderColor: C.accent },
          monsterMode && !isInspecting && styles.avatarMonster,
        ]}
        onPress={() => { if (!isInspecting) router.push("/account"); }}
        activeOpacity={isInspecting ? 1 : 0.8}
      >
        {isImageUrl(displayAvatar) ? (
          <Image source={{ uri: displayAvatar }} style={styles.avatarImage} />
        ) : (
          <Text style={[styles.avatarText, { color: C.text }]}>{displayAvatar}</Text>
        )}
        {monsterMode && !isInspecting && (
          <View style={styles.monsterBadge} />
        )}
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: C.card, borderColor: C.border }]}>
        <Ionicons name="heart" size={14} color={healthColor} />
        <Text style={[styles.statText, { color: healthColor }]}>
          {displayHealth}
        </Text>

        <View style={[styles.divider, { backgroundColor: C.border }]} />

        <Ionicons name="flash" size={14} color={strengthColor} />
        <Text style={[styles.statText, { color: strengthColor }]}>
          {Math.round(displayStrength)}
        </Text>
      </View>

      {isInspecting && (
        <Text style={[styles.inspectName, { color: C.textSecondary }]} numberOfLines={1}>
          {selectedUser.name}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  spotBlock: {
    position: "absolute",
    left: 16,
    right: 128,
    zIndex: 10,
    gap: 8,
  },
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
    borderWidth: 2,
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
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  divider: {
    width: 1,
    height: 14,
    marginHorizontal: 2,
  },
  statText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  inspectName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    maxWidth: 100,
  },
  spotImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  spotImageFill: {
    width: "100%",
    height: "100%",
  },
  spotLabelBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  spotLabelText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  spotTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  spotValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  spotMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaChipText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  minersScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  badgeWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: "hidden",
    position: "relative",
  },
  badgeFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  badgeIcon: {
    fontSize: 10,
    zIndex: 1,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    zIndex: 1,
  },
  minerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  minerRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  minerImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  minerEmoji: {
    fontSize: 15,
  },
});
