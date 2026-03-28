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

function MinerAvatar({ avatar, progress, color }: { avatar: string; progress: number; color: string }) {
  return (
    <View style={minerStyles.wrapper}>
      <View style={[minerStyles.ring, { borderColor: color + "99" }]}>
        {isImageUrl(avatar) ? (
          <Image source={{ uri: avatar }} style={minerStyles.img} />
        ) : (
          <Text style={minerStyles.emoji}>{avatar}</Text>
        )}
      </View>
      <View style={[minerStyles.badge, { backgroundColor: color + "22", borderColor: color + "66" }]}>
        <Text style={[minerStyles.badgeText, { color }]}>{Math.round(progress)}%</Text>
      </View>
    </View>
  );
}

const minerStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: 3,
  },
  ring: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: COLORS.dark.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  img: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  emoji: {
    fontSize: 14,
  },
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
});

export function UserProfileHUD({ insets }: UserProfileHUDProps) {
  const { userProfile, selectedUser, selectedSpot, nearbyUsers, activeCollection } = useGame();

  const top = Math.max(insets.top + 10, 50);

  if (selectedSpot) {
    const color = SPOT_COLORS[selectedSpot.type] ?? COLORS.dark.accent;
    const icon = SPOT_ICONS[selectedSpot.type] ?? "star";
    const label = SPOT_LABELS[selectedSpot.type] ?? selectedSpot.type;

    const isPlayerMining = activeCollection?.spotId === selectedSpot.id;
    const playerProgress = isPlayerMining ? (activeCollection?.progress ?? 0) : 0;

    const otherMiners = nearbyUsers.filter(
      (u) => u.collectingSpotId === selectedSpot.id
    );

    return (
      <View style={[styles.spotBlock, { top }]}>
        <View style={[styles.spotCard, { borderColor: color + "44" }]}>
          {/* Imagem retangular igual ao marcador do mapa */}
          <View style={[styles.spotThumb, { borderColor: color, backgroundColor: color + "18" }]}>
            {selectedSpot.imageUrl ? (
              <Image
                source={{ uri: selectedSpot.imageUrl }}
                style={styles.spotThumbImg}
                resizeMode="cover"
              />
            ) : (
              <Feather name={icon as any} size={20} color={color} />
            )}
            <View style={[styles.spotTypePill, { backgroundColor: color + "22", borderColor: color + "55" }]}>
              <Text style={[styles.spotTypeText, { color }]}>{label}</Text>
            </View>
          </View>

          {/* Info à direita */}
          <View style={styles.spotInfo}>
            <Text style={styles.spotTitle} numberOfLines={1}>{selectedSpot.title}</Text>
            <Text style={[styles.spotValue, { color }]} numberOfLines={1}>{selectedSpot.value}</Text>

            <View style={styles.spotMeta}>
              {selectedSpot.expiresAt && (
                <View style={styles.metaChip}>
                  <Feather name="clock" size={10} color={COLORS.dark.textMuted} />
                  <Text style={styles.metaChipText}>{formatExpiry(selectedSpot.expiresAt)}</Text>
                </View>
              )}
              <View style={styles.metaChip}>
                <Feather name="map-pin" size={10} color={COLORS.dark.textMuted} />
                <Text style={styles.metaChipText}>{selectedSpot.radius}m</Text>
              </View>
            </View>
          </View>
        </View>

        {isPlayerMining && (
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${playerProgress}%` as any, backgroundColor: color }]} />
              </View>
              <Text style={[styles.progressLabel, { color }]}>{Math.round(playerProgress)}%</Text>
            </View>
          </View>
        )}

        {otherMiners.length > 0 && (
          <View style={styles.minersRow}>
            <Text style={styles.minersLabel}>Minerando:</Text>
            {otherMiners.map((u) => (
              <MinerAvatar key={u.id} avatar={u.avatar} progress={u.collectProgress} color={color} />
            ))}
          </View>
        )}
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
  spotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  spotThumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
  },
  spotThumbImg: {
    width: "100%",
    height: "100%",
  },
  spotTypePill: {
    position: "absolute",
    bottom: 2,
    left: 2,
    right: 2,
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 1,
    alignItems: "center",
  },
  spotTypeText: {
    fontSize: 7,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  spotInfo: {
    flex: 1,
    gap: 2,
  },
  spotTitle: {
    color: COLORS.dark.text,
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    lineHeight: 18,
  },
  spotValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 16,
  },
  spotMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaChipText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: COLORS.dark.textMuted,
  },
  progressSection: {
    gap: 4,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.dark.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    minWidth: 30,
    textAlign: "right",
  },
  minersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  minersLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: COLORS.dark.textMuted,
  },
});
