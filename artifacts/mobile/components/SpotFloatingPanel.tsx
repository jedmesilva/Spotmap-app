import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import COLORS from "@/constants/colors";
import { Spot, useGame } from "@/context/GameContext";

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

const SPOT_HITS: Record<string, number> = {
  coupon: 5,
  money: 8,
  product: 12,
  rare: 20,
};

function formatExpiry(ts: number) {
  const diff = ts - Date.now();
  if (diff <= 0) return "Expirado";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface SpotFloatingPanelProps {
  spot: Spot;
  isInRange: boolean;
  bottomInset: number;
}

export const SPOT_FLOATING_PANEL_HEIGHT = 130;

export function SpotFloatingPanel({ spot, isInRange, bottomInset }: SpotFloatingPanelProps) {
  const { activeCollection } = useGame();
  const slideAnim = useRef(new Animated.Value(160)).current;

  const color = SPOT_COLORS[spot.type] ?? COLORS.dark.accent;
  const isCollecting = activeCollection?.spotId === spot.id;
  const progress = isCollecting ? (activeCollection?.progress ?? 0) : 0;
  const hitsRequired = SPOT_HITS[spot.type] ?? 10;
  const hitsRemaining = Math.ceil(((100 - progress) / 100) * hitsRequired);

  useEffect(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 70,
      friction: 11,
    }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: bottomInset + 10, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.typeBadge, { backgroundColor: color + "22", borderColor: color + "55" }]}>
          <Feather name={SPOT_ICONS[spot.type] as any} size={11} color={color} />
          <Text style={[styles.typeLabel, { color }]}>{SPOT_LABELS[spot.type]}</Text>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={11} color={COLORS.dark.textMuted} />
            <Text style={styles.metaText}>{spot.radius}m</Text>
          </View>
          {spot.expiresAt && (
            <View style={styles.metaItem}>
              <Feather name="clock" size={11} color={COLORS.dark.textMuted} />
              <Text style={styles.metaText}>{formatExpiry(spot.expiresAt)}</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>{spot.title}</Text>
      <Text style={[styles.value, { color }]}>{spot.value}</Text>

      {isCollecting && (
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: color }]} />
          </View>
          <Text style={[styles.progressText, { color }]}>{Math.round(progress)}%</Text>
        </View>
      )}

      {isInRange && (
        <View style={[styles.mineHint, { borderColor: color + "55", backgroundColor: color + "10" }]}>
          <Text style={styles.mineHintIcon}>⛏️</Text>
          <Text style={[styles.mineHintText, { color }]}>
            {isCollecting
              ? `${hitsRemaining} picaretada${hitsRemaining !== 1 ? "s" : ""} restante${hitsRemaining !== 1 ? "s" : ""}`
              : "Use o botão ⛏️ para minerar"}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: COLORS.dark.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 20,
    gap: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: COLORS.dark.textMuted,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.text,
  },
  value: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
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
  progressText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    minWidth: 32,
    textAlign: "right",
  },
  mineHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  mineHintIcon: {
    fontSize: 16,
  },
  mineHintText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
});
