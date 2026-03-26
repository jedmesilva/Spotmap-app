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
  const { activeCollection } = useGame();
  const color = SPOT_COLORS[spot.type] ?? COLORS.dark.accent;
  const isCollecting = activeCollection?.spotId === spot.id;
  const progress = isCollecting ? activeCollection?.progress ?? 0 : 0;
  const hitsRequired = SPOT_HITS[spot.type] ?? 10;
  const hitsRemaining = Math.ceil(((100 - progress) / 100) * hitsRequired);

  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

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

        {isCollecting && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={[styles.progressText, { color }]}>{Math.round(progress)}%</Text>
          </View>
        )}

        {isInRange && (
          <View style={[styles.mineHint, { borderColor: color + "55", backgroundColor: color + "10" }]}>
            <Text style={styles.mineHintIcon}>⛏️</Text>
            <View style={styles.mineHintBody}>
              <Text style={[styles.mineHintTitle, { color }]}>
                {isCollecting
                  ? `${hitsRemaining} picaretada${hitsRemaining !== 1 ? "s" : ""} restante${hitsRemaining !== 1 ? "s" : ""}`
                  : "Use o botão ⛏️ para minerar"}
              </Text>
              <Text style={styles.mineHintSub}>
                {hitsRequired} picaretada{hitsRequired !== 1 ? "s" : ""} necessária{hitsRequired !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        )}
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
