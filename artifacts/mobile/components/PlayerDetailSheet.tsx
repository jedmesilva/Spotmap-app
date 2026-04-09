import { Feather, Ionicons } from "@expo/vector-icons";
import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, { useEffect, useRef } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import COLORS from "@/constants/colors";
import { NearbyUser, SubstanceType, UserProfile, STRENGTH_MONSTER_THRESHOLD } from "@/context/GameContext";

function getHealthColor(health: number, maxHealth: number): string {
  const r = maxHealth > 0 ? health / maxHealth : 1;
  return r > 0.6 ? COLORS.dark.spotMoney : r > 0.3 ? COLORS.dark.warning : COLORS.dark.danger;
}

function getStrengthColor(strength: number): string {
  if (strength >= STRENGTH_MONSTER_THRESHOLD) return "#ff6b00";
  if (strength >= 150) return "#c084fc";
  if (strength >= 100) return "#60a5fa";
  if (strength >= 50) return "#94a3b8";
  return COLORS.dark.danger;
}

function ImmunityBadge({ name }: { name: SubstanceType }) {
  const labels: Record<SubstanceType, string> = {
    flame_shield: "Escudo de Fogo",
    cryo_armor: "Armadura de Gelo",
    volt_ward: "Guarda Raio",
    antidote: "Antídoto",
    barrier: "Barreira",
  };
  return (
    <View style={styles.immunityBadge}>
      <Feather name="shield" size={10} color={COLORS.dark.purple} />
      <Text style={styles.immunityText}>{labels[name] ?? name.replace("_", " ")}</Text>
    </View>
  );
}

export type PlayerDetailData =
  | { kind: "self"; profile: UserProfile }
  | { kind: "other"; user: NearbyUser };

interface PlayerDetailSheetProps {
  data: PlayerDetailData;
  onClose: () => void;
  onSelectForAttack?: (userId: string) => void;
}

export function PlayerDetailSheet({ data, onClose, onSelectForAttack }: PlayerDetailSheetProps) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    sheetRef.current?.present();
  }, []);

  const isSelf = data.kind === "self";

  const name = isSelf ? data.profile.name : data.user.name;
  const avatar = isSelf ? data.profile.avatar : data.user.avatar;
  const health = isSelf ? data.profile.health : data.user.health;
  const maxHealth = isSelf ? data.profile.maxHealth : data.user.maxHealth;
  const strength = isSelf ? data.profile.strength : data.user.strength;
  const immunities = isSelf ? data.profile.immunities : data.user.immunities;
  const collectingSpotId = isSelf ? null : data.user.collectingSpotId;
  const collectProgress = isSelf ? 0 : data.user.collectProgress;
  const medals = isSelf ? data.profile.medals : (data.user.medals ?? []);

  const healthPercent = maxHealth > 0 ? health / maxHealth : 0;
  const healthColor = getHealthColor(health, maxHealth);
  const strColor = getStrengthColor(strength);

  const isUrl = (s: string) => s.startsWith("http://") || s.startsWith("https://");

  return (
    <BottomSheetModal
      ref={sheetRef}
      enablePanDownToClose
      onDismiss={onClose}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handle}
      snapPoints={["55%", "85%"]}
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 32 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatarCircle, { borderColor: healthColor }]}>
              {isUrl(avatar) ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarEmoji}>{avatar}</Text>
              )}
            </View>
            {isSelf && (
              <View style={styles.selfBadge}>
                <Text style={styles.selfBadgeText}>Você</Text>
              </View>
            )}
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.playerName}>{name}</Text>

            {medals.length > 0 && (
              <View style={styles.medalsRow}>
                {medals.slice(0, 5).map((m) => (
                  <Text key={m.id} style={styles.medalEmoji}>{m.icon}</Text>
                ))}
                {medals.length > 5 && (
                  <Text style={styles.medalsMore}>+{medals.length - 5}</Text>
                )}
              </View>
            )}

            {isSelf && (
              <View style={styles.coinRow}>
                <Ionicons name="cash-outline" size={13} color={COLORS.dark.spotMoney} />
                <Text style={styles.coinText}>{data.profile.coins ?? 0} moedas</Text>
              </View>
            )}
          </View>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={18} color={COLORS.dark.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Feather name="heart" size={13} color={healthColor} />
            <Text style={[styles.statLabel, { color: COLORS.dark.textMuted }]}>Vida</Text>
            <View style={styles.healthTrack}>
              <View style={[styles.healthBar, { width: `${healthPercent * 100}%`, backgroundColor: healthColor }]} />
            </View>
            <Text style={[styles.statValue, { color: healthColor }]}>
              {health}/{maxHealth}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.statRow}>
            <Ionicons name="flash" size={13} color={strColor} />
            <Text style={[styles.statLabel, { color: COLORS.dark.textMuted }]}>Força</Text>
            <View style={styles.strengthBarTrack}>
              <View
                style={[
                  styles.strengthBar,
                  {
                    width: `${Math.min((strength / 300) * 100, 100)}%`,
                    backgroundColor: strColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.statValue, { color: strColor }]}>
              {Math.round(strength)}
            </Text>
          </View>
        </View>

        {immunities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>IMUNIDADES</Text>
            <View style={styles.badgesWrap}>
              {immunities.map((imm) => (
                <ImmunityBadge key={imm} name={imm} />
              ))}
            </View>
          </View>
        )}

        {collectingSpotId && (
          <View style={styles.collectCard}>
            <View style={styles.collectRow}>
              <Feather name="loader" size={13} color={COLORS.dark.warning} />
              <Text style={styles.collectLabel}>Coletando spot</Text>
              <Text style={[styles.collectPct, { color: collectProgress > 60 ? COLORS.dark.danger : COLORS.dark.warning }]}>
                {collectProgress}%
              </Text>
            </View>
            <View style={styles.collectTrack}>
              <View
                style={[
                  styles.collectBar,
                  {
                    width: `${collectProgress}%`,
                    backgroundColor: collectProgress > 60 ? COLORS.dark.danger : COLORS.dark.warning,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {isSelf && data.profile.bag.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>MOCHILA</Text>
            <View style={styles.bagGrid}>
              {data.profile.bag.map((item) => (
                <View key={item.id} style={styles.bagItem}>
                  <Text style={styles.bagIcon}>{item.icon}</Text>
                  <Text style={styles.bagName} numberOfLines={1}>{item.name}</Text>
                  <View style={styles.bagQtyBadge}>
                    <Text style={styles.bagQty}>{item.quantity}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {!isSelf && onSelectForAttack && (
          <Pressable
            style={({ pressed }) => [styles.attackBtn, { opacity: pressed ? 0.75 : 1 }]}
            onPress={() => {
              onSelectForAttack((data as { kind: "other"; user: NearbyUser }).user.id);
              onClose();
            }}
          >
            <Feather name="crosshair" size={16} color={COLORS.dark.bg} />
            <Text style={styles.attackBtnText}>Selecionar para Atacar</Text>
          </Pressable>
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
    paddingTop: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 16,
  },
  avatarWrap: {
    alignItems: "center",
    position: "relative",
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2.5,
    backgroundColor: COLORS.dark.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  selfBadge: {
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: COLORS.dark.accentGlow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.dark.accent + "55",
  },
  selfBadgeText: {
    fontSize: 10,
    color: COLORS.dark.accent,
    fontFamily: "Inter_700Bold",
  },
  headerInfo: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  playerName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.text,
  },
  medalsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexWrap: "wrap",
  },
  medalEmoji: {
    fontSize: 15,
  },
  medalsMore: {
    fontSize: 11,
    color: COLORS.dark.textMuted,
    fontFamily: "Inter_500Medium",
  },
  coinRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  coinText: {
    fontSize: 12,
    color: COLORS.dark.spotMoney,
    fontFamily: "Inter_600SemiBold",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dark.surface,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    gap: 10,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    width: 36,
  },
  statValue: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    minWidth: 46,
    textAlign: "right",
  },
  healthTrack: {
    flex: 1,
    height: 7,
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: 4,
    overflow: "hidden",
  },
  healthBar: {
    height: "100%",
    borderRadius: 4,
  },
  strengthBarTrack: {
    flex: 1,
    height: 7,
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: 4,
    overflow: "hidden",
  },
  strengthBar: {
    height: "100%",
    borderRadius: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.dark.border,
    marginHorizontal: -16,
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.textMuted,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  badgesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  immunityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: COLORS.dark.purpleGlow,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.dark.purple + "44",
  },
  immunityText: {
    fontSize: 11,
    color: COLORS.dark.purple,
    fontFamily: "Inter_500Medium",
  },
  collectCard: {
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  collectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  collectLabel: {
    flex: 1,
    fontSize: 12,
    color: COLORS.dark.textMuted,
    fontFamily: "Inter_400Regular",
  },
  collectPct: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  collectTrack: {
    height: 6,
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: 3,
    overflow: "hidden",
  },
  collectBar: {
    height: "100%",
    borderRadius: 3,
  },
  bagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  bagItem: {
    width: "22%",
    alignItems: "center",
    backgroundColor: COLORS.dark.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    paddingVertical: 10,
    paddingHorizontal: 4,
    position: "relative",
    gap: 3,
  },
  bagIcon: {
    fontSize: 22,
  },
  bagName: {
    fontSize: 9,
    color: COLORS.dark.textMuted,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  bagQtyBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.dark.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bagQty: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.bg,
  },
  attackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.dark.danger,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  attackBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.bg,
  },
});
