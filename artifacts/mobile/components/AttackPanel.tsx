import { Feather, Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
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
import { ArtifactType, NearbyUser, useGame, STRENGTH_MONSTER_THRESHOLD } from "@/context/GameContext";

function getStrengthColor(strength: number): string {
  if (strength >= STRENGTH_MONSTER_THRESHOLD) return "#ff6b00";
  if (strength >= 150) return "#c084fc";
  if (strength >= 100) return "#60a5fa";
  if (strength >= 50) return "#94a3b8";
  return COLORS.dark.danger;
}

const ARTIFACTS: {
  type: ArtifactType;
  icon: string;
  name: string;
  damage: number;
  color: string;
}[] = [
  { type: "fire", icon: "zap", name: "Fogo", damage: 25, color: COLORS.dark.danger },
  { type: "ice", icon: "wind", name: "Gelo", damage: 15, color: COLORS.dark.info },
  { type: "lightning", icon: "zap", name: "Raio", damage: 35, color: COLORS.dark.warning },
  { type: "poison", icon: "activity", name: "Veneno", damage: 20, color: COLORS.dark.spotMoney },
];

interface AttackFeedback {
  damage: number;
  blocked: boolean;
  artifact: string;
}

interface AttackPanelProps {
  user: NearbyUser;
  onClose: () => void;
}

export function AttackPanel({ user, onClose }: AttackPanelProps) {
  const insets = useSafeAreaInsets();
  const { attackUser, userProfile } = useGame();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [feedback, setFeedback] = useState<AttackFeedback | null>(null);
  const [targetHealth, setTargetHealth] = useState(user.health);
  const [targetStrength, setTargetStrength] = useState(user.strength);
  const shakeAnim = useRef(new RNAnimated.Value(0)).current;
  const feedbackOpacity = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  const handleAttack = (type: ArtifactType, artifactName: string) => {
    const itemInBag = userProfile.bag.find((i) => i.type === type);
    if (!itemInBag || itemInBag.quantity <= 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const result = attackUser(user.id, type);

    setTargetHealth((prev) => Math.max(0, prev - result.damage));
    if (!result.blocked) setTargetStrength((prev) => Math.max(0, prev - 15));
    setFeedback({ damage: result.damage, blocked: result.blocked, artifact: artifactName });

    RNAnimated.sequence([
      RNAnimated.timing(feedbackOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      RNAnimated.delay(1500),
      RNAnimated.timing(feedbackOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    if (!result.blocked) {
      RNAnimated.sequence([
        RNAnimated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        RNAnimated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  };

  const healthPercent = user.maxHealth > 0 ? targetHealth / user.maxHealth : 0;
  const healthColor =
    healthPercent > 0.6
      ? COLORS.dark.spotMoney
      : healthPercent > 0.3
      ? COLORS.dark.warning
      : COLORS.dark.danger;

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
          <View style={styles.targetSection}>
            <RNAnimated.View
              style={[styles.targetAvatar, { transform: [{ translateX: shakeAnim }], borderColor: healthColor }]}
            >
              <Text style={styles.avatarText}>{user.avatar}</Text>
            </RNAnimated.View>
            <View style={styles.targetInfo}>
              <Text style={styles.targetName}>{user.name}</Text>
              {user.collectingSpotId && (
                <View style={styles.collectingBadge}>
                  <Feather name="download" size={10} color={COLORS.dark.warning} />
                  <Text style={styles.collectingText}>Coletando spot</Text>
                </View>
              )}
              <View style={styles.healthContainer}>
                <View style={styles.healthTrack}>
                  <View
                    style={[
                      styles.healthBar,
                      { width: `${healthPercent * 100}%`, backgroundColor: healthColor },
                    ]}
                  />
                </View>
                <Text style={[styles.healthText, { color: healthColor }]}>
                  {targetHealth}/{user.maxHealth}
                </Text>
                <View style={styles.strengthPill}>
                  <Ionicons name="flash" size={10} color={getStrengthColor(targetStrength)} />
                  <Text style={[styles.strengthText, { color: getStrengthColor(targetStrength) }]}>
                    {Math.round(targetStrength)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={18} color={COLORS.dark.textSecondary} />
          </Pressable>
        </View>

        {user.immunities.length > 0 && (
          <View style={styles.immunitiesRow}>
            <Text style={styles.immunitiesLabel}>IMUNIDADES</Text>
            {user.immunities.map((imm) => (
              <View key={imm} style={styles.immunityBadge}>
                <Feather name="shield" size={10} color={COLORS.dark.purple} />
                <Text style={styles.immunityText}>{imm.replace("_", " ")}</Text>
              </View>
            ))}
          </View>
        )}

        {user.collectingSpotId && (
          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Feather name="loader" size={12} color={COLORS.dark.textMuted} />
              <Text style={styles.progressLabel}>Progresso de coleta</Text>
              <Text style={[styles.progressValue, { color: COLORS.dark.warning }]}>
                {user.collectProgress}%
              </Text>
            </View>
            <View style={styles.collectProgressTrack}>
              <View
                style={[
                  styles.collectProgressBar,
                  {
                    width: `${user.collectProgress}%`,
                    backgroundColor:
                      user.collectProgress > 60 ? COLORS.dark.danger : COLORS.dark.warning,
                  },
                ]}
              />
            </View>
          </View>
        )}

        <Text style={styles.artifactsLabel}>SELECIONE UM ARTEFATO</Text>

        <View style={styles.artifactsGrid}>
          {ARTIFACTS.map((artifact) => {
            const inBag = userProfile.bag.find((i) => i.type === artifact.type);
            const qty = inBag?.quantity ?? 0;
            const canUse = qty > 0;

            return (
              <Pressable
                key={artifact.type}
                onPress={() => canUse && handleAttack(artifact.type, artifact.name)}
                style={({ pressed }) => [
                  styles.artifactBtn,
                  {
                    backgroundColor: canUse ? artifact.color + "15" : COLORS.dark.surface,
                    borderColor: canUse ? artifact.color + "66" : COLORS.dark.border,
                    opacity: pressed ? 0.75 : canUse ? 1 : 0.4,
                  },
                ]}
              >
                <Feather
                  name={artifact.icon as any}
                  size={22}
                  color={canUse ? artifact.color : COLORS.dark.textMuted}
                />
                <Text style={[styles.artifactName, { color: canUse ? artifact.color : COLORS.dark.textMuted }]}>
                  {artifact.name}
                </Text>
                <Text style={[styles.artifactDmg, { color: canUse ? COLORS.dark.textSecondary : COLORS.dark.textMuted }]}>
                  -{artifact.damage} HP
                </Text>
                <View
                  style={[
                    styles.qtyBadge,
                    { backgroundColor: canUse ? artifact.color : COLORS.dark.border },
                  ]}
                >
                  <Text style={styles.qtyText}>{qty}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <RNAnimated.View style={[styles.feedbackBanner, { opacity: feedbackOpacity }]}>
          {feedback && (
            <>
              <Feather
                name={feedback.blocked ? "shield" : "zap"}
                size={16}
                color={feedback.blocked ? COLORS.dark.purple : COLORS.dark.danger}
              />
              <Text
                style={[
                  styles.feedbackText,
                  { color: feedback.blocked ? COLORS.dark.purple : COLORS.dark.danger },
                ]}
              >
                {feedback.blocked
                  ? `${feedback.artifact} BLOQUEADO — Imune!`
                  : `-${feedback.damage} HP — ${feedback.artifact} atingiu!`}
              </Text>
            </>
          )}
        </RNAnimated.View>
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 4,
  },
  targetSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    flex: 1,
  },
  targetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.dark.bgSecondary,
    borderWidth: 2,
    borderColor: COLORS.dark.border,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarText: {
    color: COLORS.dark.text,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  targetInfo: {
    flex: 1,
  },
  targetName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.text,
    marginBottom: 4,
  },
  collectingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  collectingText: {
    fontSize: 11,
    color: COLORS.dark.warning,
    fontFamily: "Inter_500Medium",
  },
  healthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  healthTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 3,
    overflow: "hidden",
  },
  healthBar: {
    height: "100%",
    borderRadius: 3,
  },
  healthText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  strengthPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  strengthText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  immunitiesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  immunitiesLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.textMuted,
    letterSpacing: 1,
  },
  immunityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: COLORS.dark.purpleGlow,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.dark.purple + "44",
  },
  immunityText: {
    fontSize: 10,
    color: COLORS.dark.purple,
    fontFamily: "Inter_500Medium",
  },
  progressSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  progressLabel: {
    flex: 1,
    fontSize: 12,
    color: COLORS.dark.textMuted,
    fontFamily: "Inter_400Regular",
  },
  progressValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  collectProgressTrack: {
    height: 6,
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: 3,
    overflow: "hidden",
  },
  collectProgressBar: {
    height: "100%",
    borderRadius: 3,
  },
  artifactsLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.textMuted,
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  artifactsGrid: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  artifactBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 4,
    position: "relative",
  },
  artifactName: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  artifactDmg: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  qtyBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.bg,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    minHeight: 42,
  },
  feedbackText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
