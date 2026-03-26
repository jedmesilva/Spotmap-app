import { Feather } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useEffect, useRef } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import COLORS from "@/constants/colors";
import { Spot, useGame } from "@/context/GameContext";

const SPOT_HITS: Record<string, number> = {
  coupon: 5,
  money: 8,
  product: 12,
  rare: 20,
};

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
  coupon: "CUPOM",
  money: "DINHEIRO",
  product: "PRODUTO",
  rare: "RARO",
};

function formatExpiry(ts: number) {
  const diff = ts - Date.now();
  if (diff <= 0) return "Expirado";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface SpotPanelProps {
  spot: Spot;
  onClose: () => void;
  isInRange: boolean;
}

export function SpotPanel({ spot, onClose, isInRange }: SpotPanelProps) {
  const insets = useSafeAreaInsets();
  const { activeCollection, nearbyUsers, userProfile } = useGame();
  const color = SPOT_COLORS[spot.type] ?? COLORS.dark.accent;
  const isCollecting = activeCollection?.spotId === spot.id;
  const progress = isCollecting ? activeCollection?.progress ?? 0 : 0;
  const hitsRequired = SPOT_HITS[spot.type] ?? 10;
  const hitsRemaining = Math.ceil(((100 - progress) / 100) * hitsRequired);

  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  const othersCollecting = nearbyUsers
    .filter((u) => u.collectingSpotId === spot.id)
    .sort((a, b) => b.collectProgress - a.collectProgress);

  const allCollecting = [
    ...(isCollecting
      ? [{ id: "me", name: "Você", avatar: userProfile.avatar, collectProgress: progress, isMe: true }]
      : []),
    ...othersCollecting.map((u) => ({ ...u, isMe: false })),
  ];

  return (
    <BottomSheetModal
      ref={sheetRef}
      enablePanDownToClose
      onDismiss={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.typeBadge, { backgroundColor: color + "22", borderColor: color + "55" }]}>
            <Feather name={SPOT_ICONS[spot.type] as any} size={12} color={color} />
            <Text style={[styles.typeLabel, { color }]}>{SPOT_LABELS[spot.type]}</Text>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={18} color={COLORS.dark.textSecondary} />
          </Pressable>
        </View>

        <Text style={styles.title}>{spot.title}</Text>
        <Text style={[styles.value, { color }]}>{spot.value}</Text>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={12} color={COLORS.dark.textMuted} />
            <Text style={styles.metaText}>Raio: {spot.radius}m</Text>
          </View>
          {spot.expiresAt && (
            <View style={styles.metaItem}>
              <Feather name="clock" size={12} color={COLORS.dark.textMuted} />
              <Text style={styles.metaText}>Expira em: {formatExpiry(spot.expiresAt)}</Text>
            </View>
          )}
        </View>

        {allCollecting.length > 0 && (
          <View style={styles.collectingSection}>
            <Text style={styles.sectionLabel}>
              COLETANDO AGORA · {allCollecting.length} {allCollecting.length === 1 ? "jogador" : "jogadores"}
            </Text>
            <View style={styles.badgesWrap}>
              {allCollecting.map((u) => {
                const badgeColor = u.isMe
                  ? color
                  : u.collectProgress > 60
                  ? COLORS.dark.danger
                  : COLORS.dark.warning;
                return (
                  <View
                    key={u.id}
                    style={[
                      styles.userBadge,
                      { borderColor: badgeColor + (u.isMe ? "88" : "44") },
                    ]}
                  >
                    <View style={[styles.badgeAvatar, { borderColor: badgeColor + "66" }]}>
                      <Text style={styles.badgeAvatarText}>{u.avatar}</Text>
                    </View>
                    <View style={styles.badgeBody}>
                      <Text style={[styles.badgeName, u.isMe && { color }]} numberOfLines={1}>
                        {u.name}
                      </Text>
                      <View style={[styles.fillBadge, { borderColor: badgeColor + "77" }]}>
                        <View
                          style={[
                            styles.fillLayer,
                            { width: `${u.collectProgress}%` as any, backgroundColor: badgeColor + "28" },
                          ]}
                        />
                        <Text style={styles.fillIcon}>⛏️</Text>
                        <Text style={[styles.fillText, { color: badgeColor }]}>
                          {u.collectProgress}%
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {isCollecting && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={[styles.progressText, { color }]}>{Math.round(progress)}%</Text>
          </View>
        )}

        <View style={[
          styles.mineHint,
          {
            borderColor: isInRange ? color + "55" : COLORS.dark.border,
            backgroundColor: isInRange ? color + "10" : COLORS.dark.surface,
          }
        ]}>
          <Text style={styles.mineHintIcon}>⛏️</Text>
          <View style={styles.mineHintBody}>
            <Text style={[styles.mineHintTitle, { color: isInRange ? color : COLORS.dark.textMuted }]}>
              {isInRange
                ? isCollecting
                  ? `${hitsRemaining} picaretada${hitsRemaining !== 1 ? "s" : ""} restante${hitsRemaining !== 1 ? "s" : ""}`
                  : "Use o botão ⛏️ para minerar"
                : "Fora do alcance"}
            </Text>
            <Text style={styles.mineHintSub}>
              {hitsRequired} picaretada{hitsRequired !== 1 ? "s" : ""} necessária{hitsRequired !== 1 ? "s" : ""}
            </Text>
          </View>
          {!isInRange && (
            <Feather name="map-pin" size={16} color={COLORS.dark.textMuted} />
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: COLORS.dark.card,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  handle: {
    backgroundColor: COLORS.dark.border,
    width: 36,
  },
  content: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    marginTop: 4,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.text,
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  meta: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.dark.textMuted,
    fontFamily: "Inter_400Regular",
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  collectingSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  badgesWrap: {
    gap: 8,
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  badgeAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.dark.surface,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeAvatarText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.text,
  },
  badgeBody: {
    flex: 1,
    gap: 4,
  },
  badgeName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.dark.textSecondary,
  },
  fillBadge: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  fillLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  fillIcon: {
    fontSize: 10,
  },
  fillText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  progressSection: {
    marginBottom: 12,
    gap: 6,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.dark.border,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  mineHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  mineHintIcon: {
    fontSize: 22,
  },
  mineHintBody: {
    flex: 1,
    gap: 2,
  },
  mineHintTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  mineHintSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.dark.textMuted,
  },
});
