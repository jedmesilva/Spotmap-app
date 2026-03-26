import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import COLORS from "@/constants/colors";
import { InventoryItem, SubstanceType, useGame } from "@/context/GameContext";

const ITEM_COLORS: Record<string, string> = {
  fire: COLORS.dark.danger,
  ice: COLORS.dark.info,
  lightning: COLORS.dark.warning,
  poison: COLORS.dark.spotMoney,
  flame_shield: COLORS.dark.purple,
  cryo_armor: COLORS.dark.info,
  volt_ward: COLORS.dark.warning,
  antidote: COLORS.dark.spotMoney,
  barrier: COLORS.dark.accent,
  coupon: COLORS.dark.spotCoupon,
  money: COLORS.dark.spotMoney,
  product: COLORS.dark.spotProduct,
  rare: COLORS.dark.spotRare,
};

const ITEM_ICONS: Record<string, string> = {
  fire: "zap",
  ice: "wind",
  lightning: "zap",
  poison: "activity",
  flame_shield: "shield",
  cryo_armor: "shield",
  volt_ward: "shield",
  antidote: "shield",
  barrier: "shield",
  coupon: "tag",
  money: "dollar-sign",
  product: "box",
  rare: "star",
};

const SUBSTANCE_TYPES: SubstanceType[] = [
  "flame_shield",
  "cryo_armor",
  "volt_ward",
  "antidote",
  "barrier",
];

function QuickItem({
  item,
  onUse,
  readOnly,
}: {
  item: InventoryItem;
  onUse: (item: InventoryItem) => void;
  readOnly?: boolean;
}) {
  const color = ITEM_COLORS[item.type] ?? COLORS.dark.accent;
  const icon = ITEM_ICONS[item.type] ?? "package";
  const scale = useRef(new RNAnimated.Value(1)).current;

  const handlePress = () => {
    if (readOnly) return;
    RNAnimated.sequence([
      RNAnimated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      RNAnimated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onUse(item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Pressable onPress={handlePress}>
      <RNAnimated.View
        style={[
          styles.quickItem,
          {
            backgroundColor: color + "18",
            borderColor: color + "55",
            transform: [{ scale }],
            opacity: readOnly ? 0.7 : 1,
          },
        ]}
      >
        <Feather name={icon as any} size={16} color={color} />
        {item.quantity > 1 && (
          <View style={[styles.qtyDot, { backgroundColor: color }]}>
            <Text style={styles.qtyDotText}>{item.quantity}</Text>
          </View>
        )}
      </RNAnimated.View>
    </Pressable>
  );
}

function FullItem({
  item,
  onUse,
  readOnly,
}: {
  item: InventoryItem;
  onUse: (item: InventoryItem) => void;
  readOnly?: boolean;
}) {
  const color = ITEM_COLORS[item.type] ?? COLORS.dark.accent;
  const icon = ITEM_ICONS[item.type] ?? "package";

  return (
    <Pressable
      onPress={() => { if (!readOnly) onUse(item); }}
      style={({ pressed }) => [styles.bagItem, { opacity: pressed && !readOnly ? 0.8 : 1 }]}
    >
      <View style={[styles.bagItemIcon, { backgroundColor: color + "20", borderColor: color + "44" }]}>
        <Feather name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.bagItemInfo}>
        <Text style={styles.bagItemName}>{item.name}</Text>
        <Text style={styles.bagItemType}>{item.type.replace("_", " ")}</Text>
      </View>
      <View style={[styles.bagItemQty, { backgroundColor: color + "22", borderColor: color + "44" }]}>
        <Text style={[styles.bagItemQtyText, { color }]}>×{item.quantity}</Text>
      </View>
    </Pressable>
  );
}

interface BagSidebarProps {
  insets: { top: number; bottom: number };
  onMine?: () => void;
  canMine?: boolean;
  miningProgress?: number;
  miningClicks?: number;
  extraBottomOffset?: number;
}

export function BagSidebar({ insets, onMine, canMine = false, miningProgress = 0, miningClicks = 0, extraBottomOffset = 0 }: BagSidebarProps) {
  const { userProfile, useSubstance, selectedUser } = useGame();
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const pickaxeScale = useRef(new RNAnimated.Value(1)).current;
  const pickaxeY = useRef(new RNAnimated.Value(0)).current;
  const floatY = useRef(new RNAnimated.Value(0)).current;
  const floatOpacity = useRef(new RNAnimated.Value(0)).current;

  const bottomAnim = useRef(new RNAnimated.Value(extraBottomOffset)).current;
  useEffect(() => {
    RNAnimated.spring(bottomAnim, {
      toValue: extraBottomOffset,
      useNativeDriver: false,
      tension: 70,
      friction: 11,
    }).start();
  }, [extraBottomOffset]);

  const isInspecting = selectedUser !== null;
  const displayBag = isInspecting ? (selectedUser.bag ?? []) : userProfile.bag;
  const displayCoins = isInspecting ? (selectedUser.coins ?? 0) : userProfile.coins;
  const displayImmunities = isInspecting ? selectedUser.immunities : userProfile.immunities;

  const quickItems = displayBag.filter((i) => i.quantity > 0).slice(0, 5);

  const handleUseItem = (item: InventoryItem) => {
    if (isInspecting) return;
    if (SUBSTANCE_TYPES.includes(item.type as SubstanceType)) {
      useSubstance(item.type as SubstanceType);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExpanded((v) => !v);
  };

  const handleMine = () => {
    if (!canMine) return;

    RNAnimated.parallel([
      RNAnimated.sequence([
        RNAnimated.timing(pickaxeScale, { toValue: 0.75, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(pickaxeScale, { toValue: 1.1, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(pickaxeScale, { toValue: 1, duration: 60, useNativeDriver: true }),
      ]),
      RNAnimated.sequence([
        RNAnimated.timing(pickaxeY, { toValue: -8, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(pickaxeY, { toValue: 2, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(pickaxeY, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]),
    ]).start();

    floatY.setValue(0);
    floatOpacity.setValue(1);
    RNAnimated.parallel([
      RNAnimated.timing(floatY, { toValue: -90, duration: 750, useNativeDriver: true }),
      RNAnimated.sequence([
        RNAnimated.delay(300),
        RNAnimated.timing(floatOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
      ]),
    ]).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onMine?.();
  };

  return (
    <>
      <RNAnimated.View style={[styles.column, { bottom: RNAnimated.add(insets.bottom + 16, bottomAnim) }]}>
        <View style={[styles.bagSection, isInspecting && styles.bagSectionInspecting]}>
          <TouchableOpacity
            style={styles.expandBtn}
            onPress={toggleExpand}
            activeOpacity={0.75}
          >
            <Feather
              name={expanded ? "chevron-down" : "chevron-up"}
              size={14}
              color={COLORS.dark.textSecondary}
            />
          </TouchableOpacity>

          {expanded && quickItems.length > 0 && (
            <>
              <View style={styles.itemsDivider} />
              {quickItems.map((item) => (
                <QuickItem key={item.id} item={item} onUse={handleUseItem} readOnly={isInspecting} />
              ))}
              <View style={styles.itemsDivider} />
            </>
          )}

          <Pressable
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => [styles.bagBtn, { opacity: pressed ? 0.8 : 1 }]}
          >
            <View style={[styles.bagBtnInner, isInspecting && styles.bagBtnInnerInspecting]}>
              <Feather name="briefcase" size={20} color={isInspecting ? COLORS.dark.warning : COLORS.dark.accent} />
              <View style={[styles.coinBadge, isInspecting && styles.coinBadgeInspecting]}>
                <Text style={[styles.coinText, isInspecting && styles.coinTextInspecting]}>
                  {displayCoins}
                </Text>
              </View>
            </View>
            <Text style={[styles.bagLabel, isInspecting && styles.bagLabelInspecting]}>BAG</Text>
          </Pressable>
        </View>

        <TouchableOpacity
          onPress={handleMine}
          activeOpacity={canMine ? 0.8 : 1}
          style={[styles.pickaxeBtn, canMine && styles.pickaxeBtnActive]}
        >
          <RNAnimated.View style={{ transform: [{ scale: pickaxeScale }, { translateY: pickaxeY }] }}>
            <MaterialCommunityIcons
              name="pickaxe"
              size={24}
              color={canMine ? "#F5C518" : COLORS.dark.textMuted}
            />
          </RNAnimated.View>
          {canMine && miningClicks > 0 && (
            <View style={styles.mineProgressBadge}>
              <Text style={styles.mineProgressText}>{miningClicks}x</Text>
            </View>
          )}
          <Text style={[styles.pickaxeLabel, canMine && { color: "#F5C518" }]}>MINE</Text>
        </TouchableOpacity>

        <RNAnimated.View
          pointerEvents="none"
          style={[styles.floatIcon, { transform: [{ translateY: floatY }], opacity: floatOpacity }]}
        >
          <MaterialCommunityIcons name="pickaxe" size={22} color="#F5C518" />
        </RNAnimated.View>
      </RNAnimated.View>

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setModalOpen(false)} />
          <View style={[styles.bagModal, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.handle} />
            <View style={styles.bagHeader}>
              <View style={styles.bagTitleRow}>
                <Text style={styles.bagTitle}>
                  {isInspecting ? `Bag de ${selectedUser.name}` : "Bag"}
                </Text>
                {isInspecting && (
                  <View style={styles.readOnlyBadge}>
                    <Feather name="eye" size={10} color={COLORS.dark.warning} />
                    <Text style={styles.readOnlyText}>somente leitura</Text>
                  </View>
                )}
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statChip}>
                  <Feather name="dollar-sign" size={12} color={COLORS.dark.spotMoney} />
                  <Text style={[styles.statText, { color: COLORS.dark.spotMoney }]}>
                    {displayCoins}
                  </Text>
                </View>
                {!isInspecting && (
                  <View style={styles.statChip}>
                    <Feather name="star" size={12} color={COLORS.dark.spotCoupon} />
                    <Text style={[styles.statText, { color: COLORS.dark.spotCoupon }]}>
                      Lv {userProfile.level}
                    </Text>
                  </View>
                )}
              </View>
              <Pressable onPress={() => setModalOpen(false)} style={styles.closeBtn}>
                <Feather name="x" size={18} color={COLORS.dark.textSecondary} />
              </Pressable>
            </View>

            {displayImmunities.length > 0 && (
              <View style={styles.activeImmunities}>
                <Text style={styles.sectionLabel}>IMUNIDADES ATIVAS</Text>
                <View style={styles.immunitiesRow}>
                  {displayImmunities.map((imm) => (
                    <View key={imm} style={styles.immunityBadge}>
                      <Feather name="shield" size={11} color={COLORS.dark.purple} />
                      <Text style={styles.immunityText}>{imm.replace("_", " ")}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <ScrollView showsVerticalScrollIndicator={false} style={styles.bagList}>
              <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>INVENTÁRIO</Text>
              {displayBag
                .filter((i) => i.quantity > 0)
                .map((item) => (
                  <FullItem key={item.id} item={item} onUse={handleUseItem} readOnly={isInspecting} />
                ))}
              {displayBag.filter((i) => i.quantity > 0).length === 0 && (
                <View style={styles.emptyBag}>
                  <Feather name="inbox" size={32} color={COLORS.dark.textMuted} />
                  <Text style={styles.emptyText}>Bag vazia</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  column: {
    position: "absolute",
    right: 16,
    alignItems: "center",
    flexDirection: "column",
    gap: 8,
    zIndex: 10,
  },
  bagSection: {
    alignItems: "center",
    backgroundColor: COLORS.dark.card,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.dark.accent + "33",
    paddingVertical: 10,
    paddingHorizontal: 8,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  bagSectionInspecting: {
    borderColor: COLORS.dark.warning + "44",
  },
  itemsDivider: {
    width: 28,
    height: 1.5,
    backgroundColor: COLORS.dark.border,
    borderRadius: 1,
  },
  quickItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  qtyDot: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.dark.bg,
  },
  qtyDotText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.bg,
  },
  expandBtn: {
    width: 36,
    height: 22,
    borderRadius: 8,
    backgroundColor: COLORS.dark.surface,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    alignItems: "center",
    justifyContent: "center",
  },
  bagBtn: {
    alignItems: "center",
    gap: 4,
  },
  bagBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.dark.accent + "18",
    borderWidth: 1.5,
    borderColor: COLORS.dark.accent + "55",
    alignItems: "center",
    justifyContent: "center",
  },
  bagBtnInnerInspecting: {
    backgroundColor: COLORS.dark.warning + "18",
    borderColor: COLORS.dark.warning + "55",
  },
  coinBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: COLORS.dark.bg,
    borderWidth: 1,
    borderColor: COLORS.dark.spotMoney,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  coinBadgeInspecting: {
    borderColor: COLORS.dark.warning,
  },
  coinText: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.spotMoney,
  },
  coinTextInspecting: {
    color: COLORS.dark.warning,
  },
  bagLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.accent,
    letterSpacing: 1.5,
  },
  bagLabelInspecting: {
    color: COLORS.dark.warning,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 10, 20, 0.6)",
  },
  bagModal: {
    backgroundColor: COLORS.dark.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    maxHeight: "75%",
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    borderBottomWidth: 0,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.dark.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  bagHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  bagTitleRow: {
    flex: 1,
    gap: 4,
  },
  bagTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.text,
  },
  readOnlyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
    backgroundColor: COLORS.dark.warning + "18",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: COLORS.dark.warning + "44",
  },
  readOnlyText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.dark.warning,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  statText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  activeImmunities: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.textMuted,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  immunitiesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  immunityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
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
  bagList: {
    flex: 1,
  },
  bagItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  },
  bagItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bagItemInfo: {
    flex: 1,
  },
  bagItemName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.dark.text,
    marginBottom: 2,
  },
  bagItemType: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: COLORS.dark.textMuted,
    textTransform: "capitalize",
  },
  bagItemQty: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  bagItemQtyText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  emptyBag: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.dark.textMuted,
    fontFamily: "Inter_400Regular",
  },
  pickaxeBtn: {
    alignItems: "center",
    gap: 4,
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: COLORS.dark.card,
    borderWidth: 1.5,
    borderColor: COLORS.dark.border,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
    position: "relative",
  },
  pickaxeBtnActive: {
    borderColor: "#F5C518" + "88",
    backgroundColor: "#F5C518" + "14",
    shadowColor: "#F5C518",
    shadowOpacity: 0.3,
  },
  pickaxeLabel: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.textMuted,
    letterSpacing: 1.5,
  },
  floatIcon: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  mineProgressBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: COLORS.dark.bg,
    borderWidth: 1,
    borderColor: "#F5C518",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  mineProgressText: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: "#F5C518",
  },
});
