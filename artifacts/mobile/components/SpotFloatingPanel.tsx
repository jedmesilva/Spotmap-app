import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
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

const SPOT_HITS: Record<string, number> = {
  coupon: 5,
  money: 8,
  product: 12,
  rare: 20,
};

interface SpotFloatingPanelProps {
  spot: Spot;
  isInRange: boolean;
  bottomInset: number;
}

export const SPOT_FLOATING_PANEL_HEIGHT = 52;

export function SpotFloatingPanel({ spot, isInRange, bottomInset }: SpotFloatingPanelProps) {
  const { activeCollection } = useGame();
  const slideAnim = useRef(new Animated.Value(100)).current;

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

  if (!isInRange) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { bottom: bottomInset + 10, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={[styles.mineHint, { borderColor: color + "55", backgroundColor: color + "10" }]}>
        <Text style={styles.mineHintIcon}>⛏️</Text>
        <Text style={[styles.mineHintText, { color }]}>
          {isCollecting
            ? `${hitsRemaining} picaretada${hitsRemaining !== 1 ? "s" : ""} restante${hitsRemaining !== 1 ? "s" : ""}`
            : "Use o botão ⛏️ para minerar"}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: COLORS.dark.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 20,
  },
  mineHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
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
