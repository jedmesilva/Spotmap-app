import { Feather } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
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
  isBagView?: boolean;
  onUse?: () => void;
  onManipulate?: () => void;
  onAbandon?: () => void;
}

export function SpotPanel({ spot, onClose, isInRange, isBagView = false, onUse, onManipulate, onAbandon }: SpotPanelProps) {
  const insets = useSafeAreaInsets();
  const { activeCollection } = useGame();
  const color = SPOT_COLORS[spot.type] ?? COLORS.dark.accent;
  const [imageError, setImageError] = useState(false);
  const isCollecting = activeCollection?.spotId === spot.id;
  const progress = isCollecting ? activeCollection?.progress ?? 0 : 0;
  const hitsRequired = SPOT_HITS[spot.type] ?? 10;
  const hitsRemaining = Math.ceil(((100 - progress) / 100) * hitsRequired);

  const sheetRef = useRef<BottomSheetModal>(null);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    []
  );

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  return (
    <BottomSheetModal
      ref={sheetRef}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
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

        {spot.imageUrl && !imageError ? (
          <Image
            source={{ uri: spot.imageUrl }}
            style={[styles.coverImage, { borderColor: color + "33" }]}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.coverPlaceholder, { backgroundColor: color + "15", borderColor: color + "33" }]}>
            <Feather name={SPOT_ICONS[spot.type] as any} size={40} color={color + "88"} />
          </View>
        )}

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

        {!isBagView && isInRange && isCollecting ? (
          <View style={[styles.mineHint, { borderColor: color + "55", backgroundColor: color + "10" }]}>
            <Text style={styles.mineHintIcon}>⛏️</Text>
            <View style={styles.mineHintBody}>
              <Text style={[styles.mineHintTitle, { color }]}>
                {`${hitsRemaining} picaretada${hitsRemaining !== 1 ? "s" : ""} restante${hitsRemaining !== 1 ? "s" : ""}`}
              </Text>
              <Text style={styles.mineHintSub}>
                {hitsRequired} picaretada{hitsRequired !== 1 ? "s" : ""} necessária{hitsRequired !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        ) : null}

        {isBagView && (
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, styles.actionUse, { opacity: pressed ? 0.85 : 1 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onUse?.(); }}
            >
              <Feather name="check-circle" size={18} color="#fff" />
              <Text style={styles.actionLabelPrimary}>Usar</Text>
            </Pressable>

            <View style={styles.actionsRow}>
              <Pressable
                style={({ pressed }) => [styles.actionBtnSecondary, styles.actionManipulate, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onManipulate?.(); }}
              >
                <Feather name="tool" size={15} color={COLORS.dark.spotMoney} />
                <Text style={[styles.actionLabelSecondary, { color: COLORS.dark.spotMoney }]}>Manipular</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionBtnSecondary, styles.actionAbandon, { opacity: pressed ? 0.8 : 1 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onAbandon?.(); }}
              >
                <Feather name="trash-2" size={15} color={COLORS.dark.danger} />
                <Text style={[styles.actionLabelSecondary, { color: COLORS.dark.danger }]}>Abandonar</Text>
              </Pressable>
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
  coverImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  coverPlaceholder: {
    width: "100%",
    height: 120,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
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
  actions: {
    flexDirection: "column",
    gap: 10,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  actionUse: {
    backgroundColor: COLORS.dark.accent,
    shadowColor: COLORS.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  actionManipulate: {
    borderColor: COLORS.dark.spotMoney + "55",
    backgroundColor: COLORS.dark.spotMoney + "10",
  },
  actionAbandon: {
    borderColor: COLORS.dark.danger + "55",
    backgroundColor: COLORS.dark.danger + "10",
  },
  actionLabelPrimary: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  actionLabelSecondary: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
