import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NearbyUser, SubstanceType, UserProfile, STRENGTH_MONSTER_THRESHOLD } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

function getHealthColor(health: number, maxHealth: number, C: ReturnType<typeof useColors>): string {
  const r = maxHealth > 0 ? health / maxHealth : 1;
  return r > 0.6 ? C.spotMoney : r > 0.3 ? C.warning : C.danger;
}

function getStrengthColor(strength: number, C: ReturnType<typeof useColors>): string {
  if (strength >= STRENGTH_MONSTER_THRESHOLD) return "#ff6b00";
  if (strength >= 150) return "#c084fc";
  if (strength >= 100) return "#60a5fa";
  if (strength >= 50) return "#94a3b8";
  return C.danger;
}

const IMMUNITY_LABELS: Record<SubstanceType, string> = {
  flame_shield: "ESCUDO CHAMA",
  cryo_armor: "ARMADURA CRYO",
  volt_ward: "PROTEÇÃO VOLT",
  antidote: "ANTÍDOTO",
  barrier: "BARREIRA",
};

interface DataBlockProps {
  label: string;
  value: string;
  color: string;
  icon?: string;
  wide?: boolean;
}

function DataBlock({ label, value, color, icon, wide }: DataBlockProps) {
  const C = useColors();
  return (
    <View style={[styles.dataBlock, wide && styles.dataBlockWide, { borderColor: color + "33", backgroundColor: color + "0A" }]}>
      <View style={styles.dataBlockHeader}>
        {icon && <Feather name={icon as any} size={10} color={color} />}
        <Text style={[styles.dataBlockLabel, { color: color + "AA" }]}>{label}</Text>
      </View>
      <Text style={[styles.dataBlockValue, { color }]}>{value}</Text>
    </View>
  );
}

export type PlayerDetailData =
  | { kind: "self"; profile: UserProfile }
  | { kind: "other"; user: NearbyUser };

interface PlayerDetailSheetProps {
  data: PlayerDetailData | null;
  onClose: () => void;
  onSelectForAttack?: (userId: string) => void;
}

export function PlayerDetailSheet({ data, onClose, onSelectForAttack }: PlayerDetailSheetProps) {
  const C = useColors();
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;

  const visible = data !== null;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 12,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!visible || !data) return null;

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

  const healthColor = getHealthColor(health, maxHealth, C);
  const strColor = getStrengthColor(strength, C);
  const accentColor = isSelf ? C.accent : healthColor;

  const isUrl = (s: string) => s.startsWith("http://") || s.startsWith("https://");

  const healthPct = maxHealth > 0 ? Math.round((health / maxHealth) * 100) : 0;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        {/* Scan line */}
        <Animated.View
          style={[
            styles.scanLine,
            { backgroundColor: accentColor + "88" },
            {
              transform: [{
                translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [-4, SCREEN_HEIGHT] }),
              }],
            },
          ]}
        />

        {/* Panel */}
        <Animated.View
          style={[
            styles.panel,
            { backgroundColor: C.card, borderColor: accentColor + "55", transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Notch */}
          <View style={[styles.panelNotch, { borderBottomColor: accentColor + "88" }]}>
            <View style={[styles.notchLine, { backgroundColor: accentColor }]} />
          </View>

          {/* Top bar */}
          <View style={[styles.topBar, { borderBottomColor: accentColor + "44" }]}>
            <View style={styles.topBarLeft}>
              <View style={[styles.topBarDot, { backgroundColor: accentColor }]} />
              <Text style={[styles.topBarLabel, { color: accentColor }]}>
                {isSelf ? "PERFIL DO OPERADOR" : "ANÁLISE DE OPERADOR"}
              </Text>
            </View>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }}
              style={[styles.closeBtn, { borderColor: C.border }]}
            >
              <Feather name="x" size={16} color={C.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          >
            {/* Header: avatar + name */}
            <View style={styles.headerSection}>
              <View style={[styles.avatarContainer, { borderColor: accentColor + "55" }]}>
                {isUrl(avatar) ? (
                  <Image source={{ uri: avatar }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: accentColor + "15" }]}>
                    <Text style={styles.avatarEmoji}>{avatar}</Text>
                  </View>
                )}
                {/* Corner brackets */}
                <View style={[styles.corner, styles.cornerTL, { borderColor: accentColor }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: accentColor }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: accentColor }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: accentColor }]} />
              </View>

              <View style={styles.headerInfo}>
                <View style={[styles.typeBadge, { backgroundColor: accentColor + "18", borderColor: accentColor + "55" }]}>
                  <Feather name={isSelf ? "user" : "crosshair"} size={10} color={accentColor} />
                  <Text style={[styles.typeLabel, { color: accentColor }]}>
                    {isSelf ? "VOCÊ" : "INIMIGO"}
                  </Text>
                </View>

                <Text style={[styles.playerName, { color: C.text }]}>{name}</Text>

                {medals.length > 0 && (
                  <View style={styles.medalsRow}>
                    {medals.slice(0, 4).map((m) => (
                      <Text key={m.id} style={styles.medalEmoji}>{m.icon}</Text>
                    ))}
                    {medals.length > 4 && (
                      <Text style={[styles.medalsMore, { color: C.textMuted }]}>+{medals.length - 4}</Text>
                    )}
                  </View>
                )}

                {isSelf && (
                  <View style={[styles.coinBadge, { backgroundColor: C.spotMoney + "15", borderColor: C.spotMoney + "44" }]}>
                    <Ionicons name="cash-outline" size={10} color={C.spotMoney} />
                    <Text style={[styles.coinText, { color: C.spotMoney }]}>{data.profile.coins ?? 0} MOEDAS</Text>
                  </View>
                )}

                {collectingSpotId && (
                  <View style={[styles.collectingBadge, { backgroundColor: C.warning + "18", borderColor: C.warning + "44" }]}>
                    <Feather name="download" size={10} color={C.warning} />
                    <Text style={[styles.collectingText, { color: C.warning }]}>COLETANDO</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: accentColor + "33" }]} />

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <DataBlock
                label="VIDA"
                value={`${health}/${maxHealth}`}
                color={healthColor}
                icon="heart"
              />
              <DataBlock
                label="VITALIDADE"
                value={`${healthPct}%`}
                color={healthColor}
                icon="activity"
              />
              <DataBlock
                label="FORÇA"
                value={String(Math.round(strength))}
                color={strColor}
                icon="zap"
              />
              <DataBlock
                label="NÍVEL"
                value={strength >= STRENGTH_MONSTER_THRESHOLD ? "MONSTRO" : strength >= 150 ? "ÉLITE" : strength >= 100 ? "AVANÇADO" : strength >= 50 ? "REGULAR" : "INICIANTE"}
                color={strColor}
                icon="trending-up"
              />
              {collectingSpotId && (
                <DataBlock
                  label="COLETA"
                  value={`${collectProgress}%`}
                  color={C.warning}
                  icon="loader"
                  wide
                />
              )}
              {isSelf && (
                <DataBlock
                  label="MEDALHAS"
                  value={`${medals.length}`}
                  color={C.spotRare}
                  icon="award"
                />
              )}
            </View>

            {/* Immunities */}
            {immunities.length > 0 && (
              <View style={styles.immunitiesSection}>
                <Text style={[styles.sectionLabel, { color: C.textMuted }]}>IMUNIDADES ATIVAS</Text>
                <View style={styles.badgesRow}>
                  {immunities.map((imm) => (
                    <View key={imm} style={[styles.immunityBadge, { backgroundColor: C.purple + "15", borderColor: C.purple + "44" }]}>
                      <Feather name="shield" size={10} color={C.purple} />
                      <Text style={[styles.immunityText, { color: C.purple }]}>
                        {IMMUNITY_LABELS[imm] ?? imm.replace("_", " ").toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Bag (self only) */}
            {isSelf && data.profile.bag.length > 0 && (
              <View style={styles.bagSection}>
                <Text style={[styles.sectionLabel, { color: C.textMuted }]}>INVENTÁRIO DE CAMPO</Text>
                <View style={styles.statsGrid}>
                  {data.profile.bag.map((item) => (
                    <DataBlock
                      key={item.id}
                      label={item.name.toUpperCase()}
                      value={`${item.quantity}×`}
                      color={C.textSecondary}
                      icon="package"
                    />
                  ))}
                </View>
              </View>
            )}

            {/* Intel report */}
            <View style={[styles.intelSection, { borderColor: C.border + "55" }]}>
              <Text style={[styles.sectionLabel, { color: C.textMuted }]}>RELATÓRIO DE INTELIGÊNCIA</Text>
              <Text style={[styles.intelText, { color: C.textSecondary }]}>
                {isSelf
                  ? `Operador ativo no campo. Vida em ${healthPct}% da capacidade máxima. Força registrada em ${Math.round(strength)} unidades.${immunities.length > 0 ? ` Imunidades ativas: ${immunities.length}.` : ""}`
                  : `Operador hostil detectado. Vida em ${healthPct}% da capacidade. Força ofensiva: ${Math.round(strength)}.${immunities.length > 0 ? ` Possui ${immunities.length} imunidade(s) ativa(s) — proceda com cautela.` : " Nenhuma imunidade detectada."}`
                }
              </Text>
            </View>

            {/* Action button */}
            {!isSelf && onSelectForAttack && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  onSelectForAttack((data as Extract<PlayerDetailData, { kind: "other" }>).user.id);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.actionBtn,
                  {
                    backgroundColor: C.danger,
                    borderColor: C.danger,
                    shadowColor: C.danger,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <View style={[styles.actionCorner, styles.actionCornerTL]} />
                <View style={[styles.actionCorner, styles.actionCornerTR]} />
                <Feather name="crosshair" size={18} color="#fff" />
                <Text style={styles.actionBtnText}>SELECIONAR ALVO</Text>
              </Pressable>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(7, 10, 4, 0.72)",
    justifyContent: "flex-end",
  },
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    zIndex: 10,
  },
  panel: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: SCREEN_HEIGHT * 0.80,
  },
  panelNotch: {
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  notchLine: {
    width: 44,
    height: 3,
    borderRadius: 2,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topBarDot: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  topBarLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerSection: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 90,
    height: 90,
    borderWidth: 1.5,
    borderRadius: 2,
    position: "relative",
    overflow: "visible",
    flexShrink: 0,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 2,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 38,
  },
  corner: {
    position: "absolute",
    width: 10,
    height: 10,
    borderWidth: 2,
  },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0 },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  typeLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },
  playerName: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  medalsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  medalEmoji: {
    fontSize: 14,
  },
  medalsMore: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  coinText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  collectingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 2,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  collectingText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  divider: {
    height: 1,
    marginBottom: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  dataBlock: {
    flex: 1,
    minWidth: "44%",
    borderWidth: 1,
    borderRadius: 2,
    padding: 10,
    gap: 4,
  },
  dataBlockWide: {
    minWidth: "96%",
  },
  dataBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dataBlockLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.2,
  },
  dataBlockValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  immunitiesSection: {
    marginBottom: 14,
    gap: 8,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  immunityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    borderWidth: 1,
  },
  immunityText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  bagSection: {
    marginBottom: 14,
    gap: 4,
  },
  intelSection: {
    borderWidth: 1,
    borderRadius: 2,
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  intelText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 2,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 8,
    position: "relative",
    overflow: "hidden",
  },
  actionCorner: {
    position: "absolute",
    width: 8,
    height: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
  },
  actionCornerTL: { top: 4, left: 4, borderRightWidth: 0, borderBottomWidth: 0 },
  actionCornerTR: { top: 4, right: 4, borderLeftWidth: 0, borderBottomWidth: 0 },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 2.5,
  },
});
