import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InventoryItem, Spot, SPOT_BADGE_CONFIGS, useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

const ITEM_COLORS: Record<string, string> = {
  fire: "#F06565",
  ice: "#50A8F0",
  lightning: "#F0A050",
  poison: "#60C878",
  flame_shield: "#B87CF0",
  cryo_armor: "#50A8F0",
  volt_ward: "#F0A050",
  antidote: "#60C878",
  barrier: "#7B68EE",
  coupon: "#F0A050",
  money: "#60C878",
  product: "#50A8F0",
  rare: "#B87CF0",
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

const ITEM_TYPE_LABELS: Record<string, string> = {
  fire: "FOGO",
  ice: "GELO",
  lightning: "RAIO",
  poison: "VENENO",
  flame_shield: "ESCUDO",
  cryo_armor: "ARMADURA",
  volt_ward: "PROTEÇÃO",
  antidote: "ANTÍDOTO",
  barrier: "BARREIRA",
  coupon: "CUPOM",
  money: "DINHEIRO",
  product: "PRODUTO",
  rare: "RARO",
};

function SpotCard({
  spot,
  cardWidth,
  isSelected,
  onSelect,
}: {
  spot: Spot;
  cardWidth: number;
  isSelected: boolean;
  onSelect: (spot: Spot) => void;
}) {
  const C = useColors();
  const SPOT_COLORS: Record<string, string> = {
    coupon: C.spotCoupon,
    money: C.spotMoney,
    product: C.spotProduct,
    rare: C.spotRare,
  };
  const color = SPOT_COLORS[spot.type] ?? C.accent;
  return (
    <Pressable
      onPress={() => onSelect(spot)}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, width: cardWidth })}
    >
      <View
        style={[
          styles.gridCard,
          {
            backgroundColor: isSelected ? color + "18" : C.surface,
            borderColor: isSelected ? color : color + "44",
            borderWidth: isSelected ? 2 : 1.5,
          },
        ]}
      >
        <View style={[styles.gridCardIcon, { backgroundColor: color + "18" }]}>
          <Feather name={SPOT_ICONS[spot.type] as any ?? "package"} size={20} color={color} />
        </View>
        <Text style={[styles.gridCardName, { color: C.text }]} numberOfLines={2}>{spot.title}</Text>
        <View style={[styles.gridCardPill, { backgroundColor: color + "18", borderColor: color + "33" }]}>
          <Text style={[styles.gridCardPillText, { color }]}>{SPOT_LABELS[spot.type] ?? spot.type.toUpperCase()}</Text>
        </View>
        {spot.badges && spot.badges.filter(b => b !== "manipulated").length > 0 && (
          <View style={styles.badgeStrip}>
            {spot.badges.filter(b => b !== "manipulated").slice(0, 3).map((badge) => {
              const cfg = SPOT_BADGE_CONFIGS[badge];
              if (!cfg) return null;
              return (
                <View key={badge} style={[styles.badgeDot, { backgroundColor: cfg.color + "22", borderColor: cfg.color + "66" }]}>
                  <Ionicons name={cfg.icon as any} size={9} color={cfg.color} />
                </View>
              );
            })}
          </View>
        )}
        {isSelected && (
          <View style={[styles.selectedCheck, { backgroundColor: color, borderColor: "#fff" }]}>
            <Feather name="check" size={9} color="#fff" />
          </View>
        )}
      </View>
    </Pressable>
  );
}

function ItemCard({ item, cardWidth }: { item: InventoryItem; cardWidth: number }) {
  const C = useColors();
  const color = ITEM_COLORS[item.type] ?? C.accent;
  return (
    <View style={{ width: cardWidth }}>
      <View style={[styles.gridCard, { backgroundColor: C.surface, borderColor: C.border + "44", borderWidth: 1.5 }]}>
        <View style={[styles.gridCardIcon, { backgroundColor: color + "18" }]}>
          <Feather name={ITEM_ICONS[item.type] as any ?? "package"} size={20} color={color} />
        </View>
        <Text style={[styles.gridCardName, { color: C.text }]} numberOfLines={2}>{item.name}</Text>
        <View style={[styles.gridCardPill, { backgroundColor: color + "18", borderColor: color + "33" }]}>
          <Text style={[styles.gridCardPillText, { color }]}>{ITEM_TYPE_LABELS[item.type] ?? item.type.toUpperCase()}</Text>
        </View>
        {item.quantity > 1 && (
          <View style={[styles.qtyBadge, { backgroundColor: color, borderColor: "#fff" }]}>
            <Text style={[styles.qtyBadgeText, { color: "#fff" }]}>×{item.quantity}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface InventoryButtonProps {
  insets: { bottom: number };
  extraBottomOffset?: number;
}

const SNAP_RATIO = 0; // full screen

export function InventoryButton({ insets, extraBottomOffset = 0 }: InventoryButtonProps) {
  const C = useColors();
  const { userProfile, collectedSpots, selectedInventorySpot, selectInventorySpot } = useGame();
  const sheetInsets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const NUM_COLUMNS = 3;
  const GRID_GAP = 10;
  const SHEET_PADDING = 20;
  const cardWidth = (screenWidth - SHEET_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

  const snapOpenRef = useRef(screenHeight * SNAP_RATIO);
  snapOpenRef.current = screenHeight * SNAP_RATIO;
  const screenHeightRef = useRef(screenHeight);
  screenHeightRef.current = screenHeight;

  // isOpen controls only pointer events — sheet is always rendered to avoid mount/unmount freeze
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(false);

  // +200 extra to guarantee the sheet is fully off-screen regardless of system bar differences
  const HIDDEN_Y = () => screenHeightRef.current + 200;

  // Sheet position: HIDDEN_Y = hidden below, snapOpen = visible
  const sheetY = useRef(new RNAnimated.Value(screenHeight + 200)).current;
  const backdropOpacity = useRef(new RNAnimated.Value(0)).current;

  // Pill button lift animation
  const btnDragY = useRef(new RNAnimated.Value(0)).current;

  // Track scroll position inside the sheet so we know when it's at top
  const scrollYRef = useRef(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const isDragging = useRef(false);

  const openSheet = useCallback(() => {
    const snapOpen = snapOpenRef.current;
    isOpenRef.current = true;
    setIsOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    RNAnimated.parallel([
      RNAnimated.spring(sheetY, { toValue: snapOpen, useNativeDriver: true, tension: 65, friction: 11 }),
      RNAnimated.timing(backdropOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, []);

  const closeSheet = useCallback(() => {
    setScrollEnabled(true);
    RNAnimated.parallel([
      RNAnimated.spring(sheetY, { toValue: HIDDEN_Y(), useNativeDriver: true, tension: 65, friction: 11 }),
      RNAnimated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      isOpenRef.current = false;
      setIsOpen(false);
    });
  }, []);

  const openSheetRef = useRef(openSheet);
  openSheetRef.current = openSheet;
  const closeSheetRef = useRef(closeSheet);
  closeSheetRef.current = closeSheet;

  // PanResponder on the pill button
  const buttonPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 6,

      onPanResponderGrant: () => {
        isDragging.current = false;
        sheetY.setValue(screenHeightRef.current);
        backdropOpacity.setValue(0);
        btnDragY.setValue(0);
      },

      onPanResponderMove: (_, gs) => {
        if (gs.dy < -8) {
          const snapOpen = snapOpenRef.current;
          const sh = screenHeightRef.current;
          isDragging.current = true;
          // Sheet follows finger
          const newY = Math.max(snapOpen, sh + gs.dy);
          sheetY.setValue(newY);
          const progress = Math.min(1, (sh - newY) / (sh - snapOpen));
          backdropOpacity.setValue(progress);
          // Button lifts up with the drag (clamped at -60)
          btnDragY.setValue(Math.max(gs.dy, -60));
        }
      },

      onPanResponderRelease: (_, gs) => {
        RNAnimated.spring(btnDragY, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }).start();
        if (isDragging.current) {
          if (gs.dy < -50 || gs.vy < -0.3) {
            openSheetRef.current();
          } else {
            closeSheetRef.current();
          }
        } else {
          openSheetRef.current();
        }
        isDragging.current = false;
      },

      onPanResponderTerminate: () => {
        RNAnimated.spring(btnDragY, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }).start();
        if (isDragging.current) closeSheetRef.current();
        isDragging.current = false;
      },
    })
  ).current;

  // PanResponder on the full sheet — activates on downward drag when scroll is at top
  const sheetPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) => {
        return gs.dy > 8 && scrollYRef.current < 4;
      },

      onPanResponderGrant: () => {
        setScrollEnabled(false);
      },

      onPanResponderMove: (_, gs) => {
        if (gs.dy > 0) {
          const snapOpen = snapOpenRef.current;
          const sh = screenHeightRef.current;
          sheetY.setValue(snapOpen + gs.dy);
          const progress = Math.max(0, 1 - gs.dy / (sh - snapOpen));
          backdropOpacity.setValue(progress);
        }
      },

      onPanResponderRelease: (_, gs) => {
        setScrollEnabled(true);
        if (gs.dy > 100 || gs.vy > 0.5) {
          closeSheetRef.current();
        } else {
          const snapOpen = snapOpenRef.current;
          RNAnimated.parallel([
            RNAnimated.spring(sheetY, { toValue: snapOpen, useNativeDriver: true, tension: 65, friction: 11 }),
            RNAnimated.timing(backdropOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]).start();
        }
      },

      onPanResponderTerminate: () => {
        setScrollEnabled(true);
        const snapOpen = snapOpenRef.current;
        RNAnimated.spring(sheetY, { toValue: snapOpen, useNativeDriver: true, tension: 65, friction: 11 }).start();
        backdropOpacity.setValue(1);
      },
    })
  ).current;

  const bagItems = userProfile.bag.filter(
    (i) => i.quantity > 0 && !["coupon", "money", "product", "rare"].includes(i.type)
  );
  const totalItems = collectedSpots.length + bagItems.length;
  const bottomOffset = insets.bottom + 16 + extraBottomOffset;

  return (
    <>
      {/* Full-screen sheet — always rendered, slides in/out via sheetY */}
      <RNAnimated.View
        style={[
          styles.sheet,
          { backgroundColor: C.card, zIndex: 999, transform: [{ translateY: sheetY }], opacity: backdropOpacity },
        ]}
        pointerEvents={isOpen ? "auto" : "none"}
        {...sheetPan.panHandlers}
      >
          <View style={[styles.sheetHandleArea, { paddingTop: sheetInsets.top + 8 }]}>
            <View style={[styles.sheetHandleBar, { backgroundColor: C.border }]} />
          </View>

          <ScrollView
            scrollEnabled={scrollEnabled}
            onScroll={e => { scrollYRef.current = e.nativeEvent.contentOffset.y; }}
            scrollEventThrottle={16}
            contentContainerStyle={[styles.sheetContent, { paddingBottom: sheetInsets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: C.text }]}>Inventário</Text>
              <View style={[styles.coinBadge, { backgroundColor: C.spotMoney + "18", borderColor: C.spotMoney + "44" }]}>
                <Feather name="dollar-sign" size={13} color={C.spotMoney} />
                <Text style={[styles.coinText, { color: C.spotMoney }]}>{userProfile.coins ?? 0}</Text>
              </View>
            </View>

            {collectedSpots.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: C.textMuted }]}>SPOTS COLETADOS</Text>
                  <View style={[styles.sectionBadge, { backgroundColor: C.accent + "18" }]}>
                    <Text style={[styles.sectionBadgeText, { color: C.accent }]}>{collectedSpots.length}</Text>
                  </View>
                </View>
                <View style={styles.grid}>
                  {collectedSpots.map((spot) => (
                    <SpotCard
                      key={spot.id}
                      spot={spot}
                      cardWidth={cardWidth}
                      isSelected={selectedInventorySpot?.id === spot.id}
                      onSelect={(s) => {
                        selectInventorySpot(selectedInventorySpot?.id === s.id ? null : s);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    />
                  ))}
                </View>
              </>
            )}

            {bagItems.length > 0 && (
              <>
                <View style={[styles.sectionHeader, collectedSpots.length > 0 && { marginTop: 20 }]}>
                  <Text style={[styles.sectionTitle, { color: C.textMuted }]}>ITENS</Text>
                  <View style={[styles.sectionBadge, { backgroundColor: C.purple + "18" }]}>
                    <Text style={[styles.sectionBadgeText, { color: C.purple }]}>{bagItems.length}</Text>
                  </View>
                </View>
                <View style={styles.grid}>
                  {bagItems.map((item) => (
                    <ItemCard key={item.id} item={item} cardWidth={cardWidth} />
                  ))}
                </View>
              </>
            )}

            {totalItems === 0 && (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIcon, { backgroundColor: C.surface }]}>
                  <Feather name="briefcase" size={28} color={C.textMuted} />
                </View>
                <Text style={[styles.emptyTitle, { color: C.text }]}>Inventário vazio</Text>
                <Text style={[styles.emptySub, { color: C.textMuted }]}>
                  Explore o mapa e colete spots e itens para vê-los aqui
                </Text>
              </View>
            )}
          </ScrollView>
      </RNAnimated.View>

      {/* Pill button */}
      <RNAnimated.View
        style={[styles.container, { bottom: bottomOffset, transform: [{ translateY: btnDragY }] }]}
        {...buttonPan.panHandlers}
      >
        <View style={[styles.pill, { backgroundColor: C.card, borderColor: C.border }]}>
          <View style={styles.pillContent}>
            <View style={[styles.pillIconWrap, { backgroundColor: C.accent + "18" }]}>
              <Feather name="briefcase" size={18} color={C.accent} />
              {totalItems > 0 && (
                <View style={[styles.pillBadge, { backgroundColor: C.accent, borderColor: C.bg }]}>
                  <Text style={[styles.pillBadgeText, { color: "#fff" }]}>{totalItems}</Text>
                </View>
              )}
            </View>
            <View>
              <Text style={[styles.pillLabel, { color: C.text }]}>INVENTÁRIO</Text>
              <Text style={[styles.pillSub, { color: C.textMuted }]}>
                {totalItems === 0 ? "Vazio" : `${totalItems} ${totalItems === 1 ? "item" : "itens"}`}
              </Text>
            </View>
          </View>
          <Feather name="chevron-up" size={16} color={C.textMuted} />
        </View>
      </RNAnimated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 4,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
  },
  pillContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  pillIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  pillBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  pillBadgeText: {
    fontSize: 9,
    fontWeight: "700",
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  pillSub: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 1,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  sheetHandleArea: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 12,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.5,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  coinBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  coinText: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  sectionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridCard: {
    borderRadius: 4,
    padding: 12,
    gap: 6,
    position: "relative",
  },
  gridCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  gridCardName: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  gridCardPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  gridCardPillText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  badgeStrip: {
    flexDirection: "row",
    gap: 3,
    flexWrap: "wrap",
  },
  badgeDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  qtyBadgeText: {
    fontSize: 9,
    fontWeight: "700",
  },
  selectedCheck: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },
});
