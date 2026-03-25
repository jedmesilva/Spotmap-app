import { Feather } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { activeCollection, startCollecting, stopCollecting, updateCollectProgress, completeCollection, nearbyUsers } = useGame();
  const color = SPOT_COLORS[spot.type] ?? COLORS.dark.accent;
  const isCollecting = activeCollection?.spotId === spot.id;
  const progress = isCollecting ? activeCollection?.progress ?? 0 : 0;

  const progressAnim = useRef(new RNAnimated.Value(0)).current;
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    RNAnimated.timing(progressAnim, {
      toValue: progress / 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const handleCollect = () => {
    if (!isInRange) return;
    if (isCollecting) {
      stopCollecting();
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startCollecting(spot.id);
    setCountdown(0);

    let prog = 0;
    intervalRef.current = setInterval(() => {
      prog += 2;
      updateCollectProgress(prog);
      if (prog >= 100) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        completeCollection(spot.id);
        onClose();
      }
    }, 100);
  };

  const usersCollecting = nearbyUsers
    .filter((u) => u.collectingSpotId === spot.id)
    .sort((a, b) => b.collectProgress - a.collectProgress);

  return (
    <BottomSheet
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
      bottomInset={insets.bottom}
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 32 }]}
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

        {usersCollecting.length > 0 && (
          <View style={styles.collectingSection}>
            <Text style={styles.sectionLabel}>COLETANDO AGORA</Text>
            {usersCollecting.map((u) => (
              <View key={u.id} style={styles.collectingUser}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>{u.avatar}</Text>
                </View>
                <View style={styles.userProgress}>
                  <Text style={styles.userName}>{u.name}</Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${u.collectProgress}%`,
                          backgroundColor: u.collectProgress > 60 ? COLORS.dark.danger : COLORS.dark.warning,
                        },
                      ]}
                    />
                  </View>
                </View>
                <Text style={[styles.progressText, {
                  color: u.collectProgress > 60 ? COLORS.dark.danger : COLORS.dark.warning,
                }]}>{u.collectProgress}%</Text>
              </View>
            ))}
          </View>
        )}

        {isCollecting && (
          <View style={styles.myProgress}>
            <Text style={styles.sectionLabel}>SEU PROGRESSO</Text>
            <View style={styles.myProgressTrack}>
              <RNAnimated.View
                style={[
                  styles.myProgressBar,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressPct, { color }]}>{progress}%</Text>
          </View>
        )}

        <Pressable
          onPress={handleCollect}
          disabled={!isInRange}
          style={({ pressed }) => [
            styles.collectBtn,
            {
              backgroundColor: isCollecting
                ? COLORS.dark.danger + "22"
                : isInRange
                ? color + "22"
                : COLORS.dark.surface,
              borderColor: isCollecting
                ? COLORS.dark.danger
                : isInRange
                ? color
                : COLORS.dark.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather
            name={isCollecting ? "pause-circle" : "download"}
            size={18}
            color={isCollecting ? COLORS.dark.danger : isInRange ? color : COLORS.dark.textMuted}
          />
          <Text
            style={[
              styles.collectBtnText,
              {
                color: isCollecting
                  ? COLORS.dark.danger
                  : isInRange
                  ? color
                  : COLORS.dark.textMuted,
              },
            ]}
          >
            {isCollecting ? "Parar Coleta" : isInRange ? "Coletar" : "Fora do Alcance"}
          </Text>
        </Pressable>
      </BottomSheetScrollView>
    </BottomSheet>
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
  collectingUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dark.bgSecondary,
    borderWidth: 1.5,
    borderColor: COLORS.dark.border,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    color: COLORS.dark.text,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  userProgress: {
    flex: 1,
  },
  userName: {
    fontSize: 12,
    color: COLORS.dark.textSecondary,
    fontFamily: "Inter_500Medium",
    marginBottom: 3,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    width: 32,
    textAlign: "right",
  },
  myProgress: {
    marginBottom: 16,
  },
  myProgressTrack: {
    height: 8,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 6,
  },
  myProgressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressPct: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  collectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  collectBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
