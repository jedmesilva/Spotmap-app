import { Feather } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect } from "react-native-svg";

const AnimatedRect = RNAnimated.createAnimatedComponent(Rect);

import COLORS from "@/constants/colors";
import { InventoryItem, Spot, SubstanceType, useGame } from "@/context/GameContext";
import { SpotPanel } from "@/components/SpotPanel";

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

const SPOT_TYPES = ["coupon", "money", "product", "rare"];

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

const CARD_RADIUS = 14;

function GridSpotItem({
  spot,
  isSelected,
  onPress,
  onLongSelect,
}: {
  spot: Spot;
  isSelected: boolean;
  onPress: (spot: Spot) => void;
  onLongSelect: (spot: Spot) => void;
}) {
  const color = SPOT_COLORS[spot.type] ?? COLORS.dark.accent;
  const icon = SPOT_ICONS[spot.type] ?? "package";
  const label = SPOT_LABELS[spot.type] ?? spot.type;

  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const holdProgress = useRef(new RNAnimated.Value(0)).current;
  const holdAnim = useRef<RNAnimated.CompositeAnimation | null>(null);
  const longPressTriggered = useRef(false);

  const DASH_LENGTH = 2000;

  const strokeDashoffset = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [DASH_LENGTH, 0],
  });

  const handlePressIn = () => {
    longPressTriggered.current = false;
    holdProgress.setValue(0);
    holdAnim.current = RNAnimated.timing(holdProgress, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    });
    holdAnim.current.start(({ finished }) => {
      if (finished) {
        longPressTriggered.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        RNAnimated.timing(holdProgress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
        onLongSelect(spot);
      }
    });
  };

  const handlePressOut = () => {
    holdAnim.current?.stop();
    RNAnimated.timing(holdProgress, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };

  const handlePress = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    onPress(spot);
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setCardSize({ width, height });
      }}
      style={({ pressed }) => [
        styles.gridCard,
        {
          backgroundColor: isSelected ? color + "22" : color + "10",
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {isSelected && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: CARD_RADIUS,
              borderWidth: 2,
              borderColor: color,
            },
          ]}
        />
      )}
      {!isSelected && cardSize.width > 0 && (
        <Svg
          style={StyleSheet.absoluteFill}
          width="100%"
          height="100%"
          pointerEvents="none"
        >
          <AnimatedRect
            x={2}
            y={2}
            width={cardSize.width - 4}
            height={cardSize.height - 4}
            rx={CARD_RADIUS - 2}
            ry={CARD_RADIUS - 2}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeDasharray={DASH_LENGTH}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
      )}
      <View style={[styles.gridCardIcon, { backgroundColor: color + "25", borderColor: isSelected ? color : color + "44" }]}>
        <Feather name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.gridCardName} numberOfLines={2}>{spot.title}</Text>
      <Text style={[styles.gridCardType, { color }]}>{label}</Text>
      <View style={[styles.gridCardBadge, { backgroundColor: color + "20", borderColor: color + "44" }]}>
        <Text style={[styles.gridCardBadgeText, { color }]} numberOfLines={1}>{spot.value}</Text>
      </View>
    </Pressable>
  );
}

function QuickSpotItem({
  spot,
  isSelected,
  onPress,
  onLongSelect,
}: {
  spot: Spot;
  isSelected: boolean;
  onPress: (spot: Spot) => void;
  onLongSelect: (spot: Spot) => void;
}) {
  const color = SPOT_COLORS[spot.type] ?? COLORS.dark.accent;
  const icon = SPOT_ICONS[spot.type] ?? "package";
  const scale = useRef(new RNAnimated.Value(1)).current;
  const holdProgress = useRef(new RNAnimated.Value(0)).current;
  const holdAnim = useRef<RNAnimated.CompositeAnimation | null>(null);
  const longPressTriggered = useRef(false);

  const handlePress = () => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    RNAnimated.sequence([
      RNAnimated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      RNAnimated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress(spot);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressIn = () => {
    longPressTriggered.current = false;
    holdProgress.setValue(0);
    holdAnim.current = RNAnimated.timing(holdProgress, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: false,
    });
    holdAnim.current.start(({ finished }) => {
      if (finished) {
        longPressTriggered.current = true;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        RNAnimated.timing(holdProgress, { toValue: 0, duration: 200, useNativeDriver: false }).start();
        onLongSelect(spot);
      }
    });
  };

  const handlePressOut = () => {
    holdAnim.current?.stop();
    RNAnimated.timing(holdProgress, { toValue: 0, duration: 150, useNativeDriver: false }).start();
  };

  const borderColor = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [isSelected ? color : color + "55", color],
  });

  return (
    <Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <RNAnimated.View
        style={[
          styles.quickItem,
          {
            backgroundColor: isSelected ? color + "30" : color + "18",
            borderColor: isSelected ? color : borderColor,
            borderWidth: isSelected ? 2 : 1.5,
            transform: [{ scale }],
          },
        ]}
      >
        <Feather name={icon as any} size={16} color={color} />
        {isSelected && (
          <View style={[styles.selectedDot, { backgroundColor: color }]} />
        )}
      </RNAnimated.View>
    </Pressable>
  );
}

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

function GridFullItem({
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
      style={({ pressed }) => [
        styles.gridCard,
        {
          backgroundColor: color + "10",
          borderColor: color + "33",
          opacity: pressed && !readOnly ? 0.8 : readOnly ? 0.6 : 1,
        },
      ]}
    >
      <View style={[styles.gridCardQtyBadge, { backgroundColor: color, borderColor: COLORS.dark.bg }]}>
        <Text style={styles.gridCardQtyBadgeText}>×{item.quantity}</Text>
      </View>
      <View style={[styles.gridCardIcon, { backgroundColor: color + "25", borderColor: color + "44" }]}>
        <Feather name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.gridCardName} numberOfLines={2}>{item.name}</Text>
      <Text style={[styles.gridCardType, { color }]}>{item.type.replace("_", " ")}</Text>
    </Pressable>
  );
}

interface BagSidebarProps {
  insets: { top: number; bottom: number };
  onFire?: () => void;
  canFire?: boolean;
  miningProgress?: number;
  miningClicks?: number;
  extraBottomOffset?: number;
}

export function BagSidebar({ insets, onFire, canFire = false, miningProgress = 0, miningClicks = 0, extraBottomOffset = 0 }: BagSidebarProps) {
  const { userProfile, useSubstance, selectedUser, collectedSpots, abandonSpot, useSpot, selectedInventorySpot, selectInventorySpot } = useGame();
  const sheetInsets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(false);
  const [selectedBagSpot, setSelectedBagSpot] = useState<Spot | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
    ),
    []
  );

  const fireScale = useRef(new RNAnimated.Value(1)).current;
  const fireY = useRef(new RNAnimated.Value(0)).current;
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
  // When inspecting, show player's OWN spots (so they can select to attack)
  const quickSpots = collectedSpots.slice(0, 5);
  const quickItems = !isInspecting
    ? displayBag
        .filter((i) => i.quantity > 0 && !SPOT_TYPES.includes(i.type))
        .slice(0, Math.max(0, 5 - quickSpots.length))
    : [];
  const hasQuickItems = quickSpots.length > 0 || quickItems.length > 0;

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

  const handleLongSelectSpot = (spot: Spot) => {
    if (selectedInventorySpot?.id === spot.id) {
      selectInventorySpot(null);
    } else {
      selectInventorySpot(spot);
    }
  };

  const handleFire = () => {
    if (!canFire && !selectedInventorySpot) return;

    RNAnimated.parallel([
      RNAnimated.sequence([
        RNAnimated.timing(fireScale, { toValue: 0.75, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(fireScale, { toValue: 1.1, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(fireScale, { toValue: 1, duration: 60, useNativeDriver: true }),
      ]),
      RNAnimated.sequence([
        RNAnimated.timing(fireY, { toValue: -8, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(fireY, { toValue: 2, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(fireY, { toValue: 0, duration: 60, useNativeDriver: true }),
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
    onFire?.();
  };

  const invSpotColor = selectedInventorySpot
    ? (SPOT_COLORS[selectedInventorySpot.type] ?? COLORS.dark.accent)
    : COLORS.dark.textMuted;

  const isFireActive = !!selectedInventorySpot && canFire;
  const isFireReady = !!selectedInventorySpot;

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

          {expanded && hasQuickItems && (
            <>
              <View style={styles.itemsDivider} />
              {quickSpots.map((spot) => (
                <QuickSpotItem
                  key={spot.id}
                  spot={spot}
                  isSelected={selectedInventorySpot?.id === spot.id}
                  onPress={setSelectedBagSpot}
                  onLongSelect={handleLongSelectSpot}
                />
              ))}
              {quickItems.map((item) => (
                <QuickItem key={item.id} item={item} onUse={handleUseItem} readOnly={isInspecting} />
              ))}
              <View style={styles.itemsDivider} />
            </>
          )}

          <Pressable
            onPress={() => sheetRef.current?.present()}
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
          onPress={handleFire}
          activeOpacity={isFireReady ? 0.8 : 1}
          style={[
            styles.fireBtn,
            isFireActive && { borderColor: invSpotColor + "88", backgroundColor: invSpotColor + "18" },
            isFireReady && !isFireActive && { borderColor: invSpotColor + "44", backgroundColor: invSpotColor + "0D" },
          ]}
        >
          {selectedInventorySpot ? (
            <RNAnimated.View style={{ transform: [{ scale: fireScale }, { translateY: fireY }] }}>
              <Feather
                name={SPOT_ICONS[selectedInventorySpot.type] as any}
                size={22}
                color={invSpotColor}
              />
            </RNAnimated.View>
          ) : (
            <RNAnimated.View style={{ transform: [{ scale: fireScale }, { translateY: fireY }] }}>
              <Feather
                name="zap"
                size={22}
                color={COLORS.dark.textMuted}
              />
            </RNAnimated.View>
          )}
          {isFireReady && miningClicks > 0 && (
            <View style={[styles.mineProgressBadge, { backgroundColor: invSpotColor }]}>
              <Text style={styles.mineProgressText}>{miningClicks}x</Text>
            </View>
          )}
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[
              styles.fireLabel,
              isFireReady && { color: invSpotColor },
              selectedInventorySpot && { letterSpacing: 0 },
            ]}
          >
            {selectedInventorySpot
              ? SPOT_LABELS[selectedInventorySpot.type] ?? selectedInventorySpot.type.toUpperCase()
              : isInspecting ? "ATK" : "FIRE"}
          </Text>
        </TouchableOpacity>

        <RNAnimated.View
          pointerEvents="none"
          style={[styles.floatIcon, { transform: [{ translateY: floatY }], opacity: floatOpacity }]}
        >
          <Feather name="zap" size={22} color={invSpotColor} />
        </RNAnimated.View>
      </RNAnimated.View>

      <BottomSheetModal
        ref={sheetRef}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
      >
        <BottomSheetScrollView
          contentContainerStyle={[styles.sheetContent, { paddingBottom: 32 + sheetInsets.bottom }]}
          showsVerticalScrollIndicator={false}
        >
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
            <Pressable onPress={() => sheetRef.current?.dismiss()} style={styles.closeBtn}>
              <Feather name="x" size={18} color={COLORS.dark.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.sectionLabel, { marginBottom: 10 }]}>MEUS SPOTS</Text>
          <View style={styles.gridContainer}>
            {collectedSpots.map((spot) => (
              <GridSpotItem
                key={spot.id}
                spot={spot}
                isSelected={selectedInventorySpot?.id === spot.id}
                onPress={setSelectedBagSpot}
                onLongSelect={handleLongSelectSpot}
              />
            ))}
            {displayBag
              .filter((i) => i.quantity > 0 && !SPOT_TYPES.includes(i.type))
              .map((item) => (
                <GridFullItem key={item.id} item={item} onUse={handleUseItem} readOnly={isInspecting} />
              ))}
          </View>
          {(isInspecting ? displayBag.filter((i) => i.quantity > 0) : [...collectedSpots, ...displayBag.filter((i) => i.quantity > 0 && !SPOT_TYPES.includes(i.type))]).length === 0 && (
            <View style={styles.emptyBag}>
              <Feather name="inbox" size={32} color={COLORS.dark.textMuted} />
              <Text style={styles.emptyText}>Bag vazia</Text>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>

      {selectedBagSpot && (
        <SpotPanel
          spot={selectedBagSpot}
          onClose={() => setSelectedBagSpot(null)}
          isInRange={false}
          isBagView={true}
          onUse={() => {
            useSpot(selectedBagSpot.id);
            setSelectedBagSpot(null);
          }}
          onManipulate={() => {}}
          onAbandon={() => {
            abandonSpot(selectedBagSpot.id);
            setSelectedBagSpot(null);
          }}
        />
      )}
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
  sheetBackground: {
    backgroundColor: COLORS.dark.card,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  handle: {
    backgroundColor: COLORS.dark.border,
    width: 36,
  },
  sheetContent: {
    paddingHorizontal: 20,
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
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  gridCard: {
    width: "30%",
    flexGrow: 1,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    gap: 6,
    position: "relative",
    minWidth: 90,
  },
  gridCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gridCardName: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.dark.text,
    textAlign: "center",
    lineHeight: 15,
  },
  gridCardType: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
  },
  gridCardBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: "100%",
  },
  gridCardBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  gridCardQtyBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    zIndex: 1,
  },
  gridCardQtyBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.bg,
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
  spotValue: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: 120,
  },
  spotValueText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },
  fireBtn: {
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
  fireLabel: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.textMuted,
    letterSpacing: 1.5,
  },
  selectedSpotIndicator: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedDot: {
    position: "absolute",
    bottom: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.dark.bg,
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
