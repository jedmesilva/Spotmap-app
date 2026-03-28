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
import { Medal, MedalRarity, computeMedalRarity } from "@/context/GameContext";
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

function MedalBadge({ medal, totalUsers, onPress }: { medal: Medal; totalUsers: number; onPress: () => void }) {
  const locked = !medal.unlockedAt;
  const rarity = computeMedalRarity(medal.holderCount, totalUsers);
  const color = locked ? COLORS.dark.textMuted : RARITY_COLOR[rarity];
  const glow = locked ? "transparent" : RARITY_GLOW[rarity];

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
  const { userProfile, selectedUser, totalUsers } = useGame();
  const [selected, setSelected] = useState<Medal | null>(null);

  const isInspecting = selectedUser !== null;
  const top = Math.max(insets.top + 10, 50) + 50;

  const medals = isInspecting
    ? (selectedUser.medals ?? [])
    : userProfile.medals;

  const unlockedFirst = [...medals].sort((a, b) => {
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
          {unlockedFirst.length > 0 ? (
            unlockedFirst.map((medal) => (
              <MedalBadge key={medal.id} medal={medal} totalUsers={totalUsers} onPress={() => setSelected(medal)} />
            ))
          ) : (
            <View style={styles.emptyMedals}>
              <Text style={styles.emptyMedalsText}>Sem medalhas</Text>
            </View>
          )}
        </ScrollView>
      </View>

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setSelected(null)}>
          {selected && (() => {
            const rarity = computeMedalRarity(selected.holderCount, totalUsers);
            const rarityColor = selected.unlockedAt ? RARITY_COLOR[rarity] : COLORS.dark.textMuted;
            const rarityGlow = selected.unlockedAt ? RARITY_GLOW[rarity] : "transparent";
            return (
              <View style={styles.card}>
                <View style={[styles.cardCircle, { borderColor: rarityColor, shadowColor: rarityGlow }]}>
                  <Text style={styles.cardIcon}>
                    {selected.unlockedAt ? selected.icon : "🔒"}
                  </Text>
                </View>

                <View
                  style={[
                    styles.rarityBadge,
                    {
                      backgroundColor: rarityColor + "22",
                      borderColor: rarityColor + "66",
                    },
                  ]}
                >
                  <Text style={[styles.rarityText, { color: rarityColor }]}>
                    {RARITY_LABEL[rarity]}
                  </Text>
                </View>

                <Text style={styles.cardName}>{selected.name}</Text>
                <Text style={styles.cardDesc}>{selected.description}</Text>
                <Text style={styles.cardHolders}>
                  {selected.holderCount} {selected.holderCount === 1 ? "jogador possui" : "jogadores possuem"}
                </Text>

                {selected.unlockedAt ? (
                  <Text style={styles.cardDate}>
                    Conquistada em{" "}
                    {new Date(selected.unlockedAt).toLocaleDateString("pt-BR")}
                  </Text>
                ) : (
                  <Text style={styles.cardLocked}>Ainda não conquistada</Text>
                )}
              </View>
            );
          })()}
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
  emptyMedals: {
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  emptyMedalsText: {
    fontSize: 12,
    color: COLORS.dark.textMuted,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
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
  cardHolders: {
    color: COLORS.dark.textSecondary,
    fontSize: 12,
    marginTop: 2,
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
