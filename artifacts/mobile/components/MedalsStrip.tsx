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

import { useColors } from "@/hooks/useColors";
import { Medal } from "@/context/GameContext";
import { useGame } from "@/context/GameContext";

interface MedalsStripProps {
  insets: { top: number };
}

function MedalBadge({ medal, onPress }: { medal: Medal; onPress: () => void }) {
  const C = useColors();
  const locked = !medal.unlockedAt;

  return (
    <TouchableOpacity style={styles.badgeContainer} onPress={onPress} activeOpacity={0.75}>
      <View
        style={[
          styles.badgeCircle,
          {
            backgroundColor: C.bgSecondary,
            borderColor: C.accent,
            shadowColor: C.accent,
          },
          locked && { opacity: 0.45, borderColor: C.border, shadowColor: "transparent" },
        ]}
      >
        <Text style={[styles.badgeIcon, locked && styles.badgeIconLocked]}>
          {locked ? "🔒" : medal.icon}
        </Text>
      </View>
      <Text style={[styles.badgeName, { color: locked ? C.textMuted : C.text }]} numberOfLines={1}>
        {medal.name}
      </Text>
    </TouchableOpacity>
  );
}

export function MedalsStrip({ insets }: MedalsStripProps) {
  const C = useColors();
  const { userProfile, selectedUser } = useGame();
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
            <View style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.border }]}>
              <View style={[
                styles.cardCircle,
                {
                  backgroundColor: C.bg,
                  borderColor: selected.unlockedAt ? C.accent : C.textMuted,
                  shadowColor: selected.unlockedAt ? C.accent : "transparent",
                },
              ]}>
                <Text style={styles.cardIcon}>
                  {selected.unlockedAt ? selected.icon : "🔒"}
                </Text>
              </View>

              <Text style={[styles.cardName, { color: C.text }]}>{selected.name}</Text>
              <Text style={[styles.cardDesc, { color: C.textSecondary }]}>{selected.description}</Text>
              <Text style={[styles.cardHolders, { color: C.textSecondary }]}>
                {selected.holderCount} {selected.holderCount === 1 ? "jogador possui" : "jogadores possuem"}
              </Text>

              {selected.unlockedAt ? (
                <Text style={[styles.cardDate, { color: C.textMuted }]}>
                  Conquistada em{" "}
                  {new Date(selected.unlockedAt).toLocaleDateString("pt-BR")}
                </Text>
              ) : (
                <Text style={[styles.cardLocked, { color: C.textMuted }]}>Ainda não conquistada</Text>
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
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
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
    borderRadius: 20,
    borderWidth: 1,
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
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardName: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
  cardHolders: {
    fontSize: 12,
    marginTop: 2,
  },
  cardDate: {
    fontSize: 11,
    marginTop: 4,
  },
  cardLocked: {
    fontSize: 11,
    marginTop: 4,
    fontStyle: "italic",
  },
});
