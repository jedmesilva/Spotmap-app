import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import COLORS from "@/constants/colors";
import { Medal, MedalRarity } from "@/context/GameContext";
import { useGame } from "@/context/GameContext";

interface MedalsStripProps {
  insets: { top: number };
}

const RARITY_COLOR: Record<MedalRarity, string> = {
  common: COLORS.dark.border,
  rare: COLORS.dark.purple,
  epic: COLORS.dark.info,
  legendary: COLORS.dark.warning,
};

const RARITY_GLOW: Record<MedalRarity, string> = {
  common: "transparent",
  rare: COLORS.dark.purpleGlow,
  epic: COLORS.dark.infoGlow,
  legendary: COLORS.dark.warningGlow,
};

const RARITY_LABEL: Record<MedalRarity, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

function MedalBadge({ medal, onPress }: { medal: Medal; onPress: () => void }) {
  const locked = !medal.unlockedAt;
  const color = locked ? COLORS.dark.textMuted : RARITY_COLOR[medal.rarity];
  const glow = locked ? "transparent" : RARITY_GLOW[medal.rarity];

  return (
    <TouchableOpacity style={styles.badgeContainer} onPress={onPress} activeOpacity={0.75}>
      <View
        style={[
          styles.badgeCircle,
          { borderColor: color, shadowColor: glow },
          locked && styles.badgeLocked,
        ]}
      >
        <Text style={[styles.badgeIcon, locked && styles.badgeIconLocked]}>
          {locked ? "🔒" : medal.icon}
        </Text>
      </View>
      <Text style={[styles.badgeName, { color: locked ? COLORS.dark.textMuted : color }]} numberOfLines={1}>
        {medal.name}
      </Text>
    </TouchableOpacity>
  );
}

export function MedalsStrip({ insets }: MedalsStripProps) {
  const { userProfile } = useGame();
  const [selected, setSelected] = useState<Medal | null>(null);

  const top = Math.max(insets.top + 10, 50) + 50;

  const unlockedFirst = [...userProfile.medals].sort((a, b) => {
    if (!!a.unlockedAt === !!b.unlockedAt) return 0;
    return a.unlockedAt ? -1 : 1;
  });

  return (
    <>
      <View style={[styles.strip, { top }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {unlockedFirst.map((medal) => (
            <MedalBadge key={medal.id} medal={medal} onPress={() => setSelected(medal)} />
          ))}
        </ScrollView>
      </View>

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSelected(null)}>
          {selected && (
            <View style={styles.card}>
              <View
                style={[
                  styles.cardCircle,
                  {
                    borderColor: selected.unlockedAt
                      ? RARITY_COLOR[selected.rarity]
                      : COLORS.dark.textMuted,
                    shadowColor: selected.unlockedAt
                      ? RARITY_GLOW[selected.rarity]
                      : "transparent",
                  },
                ]}
              >
                <Text style={styles.cardIcon}>
                  {selected.unlockedAt ? selected.icon : "🔒"}
                </Text>
              </View>

              <View
                style={[
                  styles.rarityBadge,
                  {
                    backgroundColor: selected.unlockedAt
                      ? RARITY_COLOR[selected.rarity] + "22"
                      : COLORS.dark.border + "22",
                    borderColor: selected.unlockedAt
                      ? RARITY_COLOR[selected.rarity] + "66"
                      : COLORS.dark.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rarityText,
                    {
                      color: selected.unlockedAt
                        ? RARITY_COLOR[selected.rarity]
                        : COLORS.dark.textMuted,
                    },
                  ]}
                >
                  {RARITY_LABEL[selected.rarity]}
                </Text>
              </View>

              <Text style={styles.cardName}>{selected.name}</Text>
              <Text style={styles.cardDesc}>{selected.description}</Text>

              {selected.unlockedAt ? (
                <Text style={styles.cardDate}>
                  Conquistada em{" "}
                  {new Date(selected.unlockedAt).toLocaleDateString("pt-BR")}
                </Text>
              ) : (
                <Text style={styles.cardLocked}>Ainda não conquistada</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  badgeContainer: {
    alignItems: "center",
    width: 52,
  },
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.dark.bgSecondary,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeLocked: {
    opacity: 0.45,
  },
  badgeIcon: {
    fontSize: 20,
  },
  badgeIconLocked: {
    fontSize: 16,
  },
  badgeName: {
    fontSize: 9,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
    marginTop: 4,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5,10,20,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    paddingVertical: 28,
    paddingHorizontal: 32,
    alignItems: "center",
    width: 260,
    gap: 8,
  },
  cardCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.dark.bg,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 6,
  },
  cardIcon: {
    fontSize: 32,
  },
  rarityBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  rarityText: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "System" : "sans-serif-medium",
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  cardName: {
    color: COLORS.dark.text,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 2,
  },
  cardDesc: {
    color: COLORS.dark.textSecondary,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  cardDate: {
    color: COLORS.dark.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  cardLocked: {
    color: COLORS.dark.textMuted,
    fontSize: 11,
    marginTop: 4,
    fontStyle: "italic",
  },
});
