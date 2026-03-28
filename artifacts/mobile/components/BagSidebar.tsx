import { Feather, Ionicons } from "@expo/vector-icons";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Rect } from "react-native-svg";

const AnimatedRect = RNAnimated.createAnimatedComponent(Rect);

import COLORS from "@/constants/colors";
import { InventoryItem, Spot, SPOT_BADGE_CONFIGS, SubstanceType, useGame } from "@/context/GameContext";
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



const CARD_RADIUS = 14;

const LONG_MENU_ITEM_HEIGHT = 50;
const LONG_MENU_ITEM_GAP = 6;
const LONG_MENU_ITEM_SLOT = LONG_MENU_ITEM_HEIGHT + LONG_MENU_ITEM_GAP;
const LONG_MENU_ITEM_WIDTH = 168;
const FIRE_BTN_WIDTH = 68;
const FIRE_BTN_HEIGHT = 68;
const LONG_MENU_GAP_FROM_BTN = 16;

function GridSpotItem({
  spot,
  isFireSelected,
  onPress,
  onLongSelect,
  cardWidth,
}: {
  spot: Spot;
  isFireSelected: boolean;
  onPress: (spot: Spot) => void;
  onLongSelect: (spot: Spot) => void;
  cardWidth: number;
}) {
  const color = SPOT_COLORS[spot.type] ?? COLORS.dark.accent;
  const isManipulated = spot.badges?.includes("manipulated");

  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const holdProgress = useRef(new RNAnimated.Value(0)).current;
  const holdAnim = useRef<RNAnimated.CompositeAnimation | null>(null);
  const longPressTriggered = useRef(false);

  const perimeter = cardSize.width > 0
    ? Math.ceil(2 * (cardSize.width + cardSize.height))
    : 800;

  const strokeDashoffset = React.useMemo(() => holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [perimeter, 0],
  }), [perimeter]);

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

  const borderColor = isFireSelected ? color + "88" : "#ffffff14";

  return (
    <View style={{ width: cardWidth, position: "relative" }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setCardSize({ width, height });
        }}
        style={({ pressed }) => [
          styles.newGridCard,
          {
            width: cardWidth,
            backgroundColor: COLORS.dark.surface,
            borderColor,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        {cardSize.width > 0 && (
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
              strokeDasharray={perimeter}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </Svg>
        )}

        <View style={styles.newGridCardIcon}>
          <Feather name={SPOT_ICONS[spot.type] as any ?? "package"} size={22} color={color} />
        </View>

        <Text style={styles.newGridCardName} numberOfLines={2}>{spot.title}</Text>

        <View style={[styles.newGridCardTypePill, { backgroundColor: color + "18", borderColor: color + "33" }]}>
          <Text style={[styles.newGridCardTypeText, { color }]}>{SPOT_LABELS[spot.type] ?? spot.type.toUpperCase()}</Text>
        </View>

        {spot.badges && spot.badges.length > 0 && (
          <View style={styles.spotBadgeStrip}>
            {spot.badges.filter(b => b !== "manipulated").map((badge) => {
              const cfg = SPOT_BADGE_CONFIGS[badge];
              if (!cfg) return null;
              return (
                <View key={badge} style={[styles.spotBadgePill, { backgroundColor: cfg.color + "22", borderColor: cfg.color + "66" }]}>
                  <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
                </View>
              );
            })}
          </View>
        )}
      </Pressable>

      {isManipulated && (
        <View style={styles.manipulatedBadge} pointerEvents="none">
          <Ionicons name="flask-outline" size={10} color="#7eefc4" />
        </View>
      )}
    </View>
  );
}

function GridFullItem({
  item,
  onUse,
  readOnly,
  cardWidth,
}: {
  item: InventoryItem;
  onUse: (item: InventoryItem) => void;
  readOnly?: boolean;
  cardWidth: number;
}) {
  const color = ITEM_COLORS[item.type] ?? COLORS.dark.accent;

  return (
    <View style={{ width: cardWidth, position: "relative" }}>
      <Pressable
        onPress={() => { if (!readOnly) onUse(item); }}
        style={({ pressed }) => [
          styles.newGridCard,
          {
            width: cardWidth,
            backgroundColor: COLORS.dark.surface,
            borderColor: "#ffffff14",
            opacity: pressed && !readOnly ? 0.8 : readOnly ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.newGridCardIcon}>
          <Feather name={ITEM_ICONS[item.type] as any ?? "package"} size={22} color={color} />
        </View>

        <Text style={styles.newGridCardName} numberOfLines={2}>{item.name}</Text>

        <View style={[styles.newGridCardTypePill, { backgroundColor: color + "18", borderColor: color + "33" }]}>
          <Text style={[styles.newGridCardTypeText, { color }]}>{ITEM_TYPE_LABELS[item.type] ?? item.type.toUpperCase()}</Text>
        </View>
      </Pressable>

      {item.quantity > 1 && (
        <View style={styles.qtyBadge} pointerEvents="none">
          <Text style={styles.qtyBadgeText}>×{item.quantity}</Text>
        </View>
      )}
    </View>
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
      <RNAnimated.View style={{ transform: [{ scale }] }}>
        <RNAnimated.View
          style={[
            styles.quickItem,
            {
              backgroundColor: isSelected ? color + "30" : color + "18",
              borderColor: isSelected ? color : borderColor,
              borderWidth: isSelected ? 2 : 1.5,
            },
          ]}
        >
          <Feather name={icon as any} size={16} color={color} />
          {isSelected && (
            <View style={[styles.selectedDot, { backgroundColor: color }]} />
          )}
          {spot.badges && spot.badges.length > 0 && (
            <View style={styles.quickBadgeGroup}>
              {spot.badges.slice(0, 3).map((badge) => {
                const cfg = SPOT_BADGE_CONFIGS[badge];
                if (!cfg) return null;
                return (
                  <View key={badge} style={[styles.quickBadgeDot, { backgroundColor: cfg.color }]}>
                    <Ionicons name={cfg.icon as any} size={6} color="#fff" />
                  </View>
                );
              })}
            </View>
          )}
        </RNAnimated.View>
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
        <View style={[styles.qtyDot, { backgroundColor: color }]}>
          <Text style={styles.qtyDotText}>{item.quantity}</Text>
        </View>
      </RNAnimated.View>
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
  const { width: screenWidth } = useWindowDimensions();
  const NUM_COLUMNS = 3;
  const GRID_GAP = 10;
  const SHEET_PADDING = 20;
  const cardWidth = (screenWidth - SHEET_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
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

  const [longMenuOpen, setLongMenuOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const longMenuOpenRef = useRef(false);
  const hoveredIndexRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fireBtnContainerRef = useRef<View>(null);
  const fireBtnRectRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const menuAnim = useRef(new RNAnimated.Value(0)).current;

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
  const handleUseItem = (item: InventoryItem) => {
    if (isInspecting) return;
    if (SUBSTANCE_TYPES.includes(item.type as SubstanceType)) {
      useSubstance(item.type as SubstanceType);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

  const menuItems = useMemo(() => {
    type MenuItem = {
      id: string;
      label: string;
      sublabel: string;
      color: string;
      icon: string;
      kind: "spot" | "item";
      spot?: Spot;
      item?: InventoryItem;
      qty?: number;
    };
    const spotEntries: MenuItem[] = collectedSpots.slice(0, 5).map((s) => ({
      id: s.id,
      label: s.title,
      sublabel: SPOT_LABELS[s.type] ?? s.type,
      color: SPOT_COLORS[s.type] ?? COLORS.dark.accent,
      icon: SPOT_ICONS[s.type] ?? "package",
      kind: "spot",
      spot: s,
    }));
    const itemEntries: MenuItem[] = displayBag
      .filter((i) => i.quantity > 0 && !SPOT_TYPES.includes(i.type))
      .slice(0, 5)
      .map((i) => ({
        id: i.id,
        label: i.name,
        sublabel: ITEM_TYPE_LABELS[i.type] ?? i.type,
        color: ITEM_COLORS[i.type] ?? COLORS.dark.accent,
        icon: ITEM_ICONS[i.type] ?? "package",
        kind: "item",
        item: i,
        qty: i.quantity,
      }));
    return [...spotEntries, ...itemEntries].slice(0, 5);
  }, [collectedSpots, displayBag]);

  const menuItemsRef = useRef(menuItems);
  menuItemsRef.current = menuItems;

  const openLongMenu = useCallback(() => {
    fireBtnContainerRef.current?.measureInWindow((x, y, w, h) => {
      fireBtnRectRef.current = { x, y, w, h };
      longMenuOpenRef.current = true;
      setLongMenuOpen(true);
      setHoveredIndex(null);
      hoveredIndexRef.current = null;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      menuAnim.setValue(0);
      RNAnimated.spring(menuAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 160,
        friction: 7,
      }).start();
    });
  }, [menuAnim]);

  const closeLongMenu = useCallback(
    (selectIdx?: number) => {
      const items = menuItemsRef.current;
      if (selectIdx !== undefined && selectIdx >= 0 && selectIdx < items.length) {
        const menuItem = items[selectIdx];
        if (menuItem.kind === "spot" && menuItem.spot) handleLongSelectSpot(menuItem.spot);
        else if (menuItem.kind === "item" && menuItem.item) handleUseItem(menuItem.item);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      RNAnimated.timing(menuAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
        longMenuOpenRef.current = false;
        setLongMenuOpen(false);
        setHoveredIndex(null);
        hoveredIndexRef.current = null;
      });
    },
    [menuAnim, handleLongSelectSpot, handleUseItem]
  );

  const openLongMenuRef = useRef(openLongMenu);
  openLongMenuRef.current = openLongMenu;
  const closeLongMenuRef = useRef(closeLongMenu);
  closeLongMenuRef.current = closeLongMenu;

  const handleFireRef = useRef(handleFire);
  handleFireRef.current = handleFire;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => longMenuOpenRef.current,
      onShouldBlockNativeResponder: () => longMenuOpenRef.current,

      onPanResponderGrant: () => {
        if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = setTimeout(() => {
          longPressTimerRef.current = null;
          openLongMenuRef.current();
        }, 480);
      },

      onPanResponderMove: (evt) => {
        if (!longMenuOpenRef.current) return;
        const rect = fireBtnRectRef.current;
        const items = menuItemsRef.current;
        if (!rect || items.length === 0) return;

        const touchY = evt.nativeEvent.pageY;
        const touchX = evt.nativeEvent.pageX;

        // List is above the button, items ordered top→bottom (index 0 = top, n-1 = bottom/closest to btn)
        const listBottom = rect.y - LONG_MENU_GAP_FROM_BTN;
        const listTop = listBottom - items.length * LONG_MENU_ITEM_SLOT;
        const listRight = rect.x + rect.w;
        const listLeft = listRight - LONG_MENU_ITEM_WIDTH;

        const inX = touchX >= listLeft - 16 && touchX <= listRight + 16;
        const inY = touchY >= listTop - 16 && touchY <= listBottom + 16;

        if (inX && inY) {
          const relY = touchY - listTop;
          const idx = Math.max(0, Math.min(items.length - 1, Math.floor(relY / LONG_MENU_ITEM_SLOT)));
          if (hoveredIndexRef.current !== idx) {
            hoveredIndexRef.current = idx;
            setHoveredIndex(idx);
            Haptics.selectionAsync();
          }
        } else {
          if (hoveredIndexRef.current !== null) {
            hoveredIndexRef.current = null;
            setHoveredIndex(null);
          }
        }
      },

      onPanResponderRelease: () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
          handleFireRef.current();
          return;
        }
        if (longMenuOpenRef.current) {
          const idx = hoveredIndexRef.current;
          closeLongMenuRef.current(idx !== null ? idx : undefined);
        }
      },

      onPanResponderTerminate: () => {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        if (longMenuOpenRef.current) {
          closeLongMenuRef.current();
        }
      },
    })
  ).current;

  const invSpotColor = selectedInventorySpot
    ? (SPOT_COLORS[selectedInventorySpot.type] ?? COLORS.dark.accent)
    : COLORS.dark.textMuted;

  const isFireActive = !!selectedInventorySpot && canFire;
  const isFireReady = !!selectedInventorySpot;

  const isEmpty = (isInspecting
    ? displayBag.filter((i) => i.quantity > 0)
    : [...collectedSpots, ...displayBag.filter((i) => i.quantity > 0 && !SPOT_TYPES.includes(i.type))]
  ).length === 0;

  return (
    <>
      <RNAnimated.View style={[styles.column, { bottom: RNAnimated.add(insets.bottom + 16, bottomAnim) }]}>
        <Pressable
          onPress={() => sheetRef.current?.present()}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
        >
          <View
            style={[
              styles.fireBtn,
              isInspecting && { borderColor: COLORS.dark.warning + "55", backgroundColor: COLORS.dark.warning + "18" },
            ]}
          >
            <Feather name="briefcase" size={22} color={isInspecting ? COLORS.dark.warning : "#fff"} />
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.fireLabel,
                { color: isInspecting ? COLORS.dark.warning : "#fff" },
              ]}
            >
              BAG
            </Text>
          </View>
        </Pressable>

        {longMenuOpen && (
          <RNAnimated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -3000,
              left: -3000,
              width: 6000,
              height: 6000,
              backgroundColor: "rgba(0,0,0,0.62)",
              opacity: menuAnim,
            }}
          />
        )}

        <View
          ref={fireBtnContainerRef}
          {...panResponder.panHandlers}
          style={[styles.fireBtnWrapper]}
        >
          <View
            style={[
              styles.fireBtn,

              isFireReady && { backgroundColor: invSpotColor, borderColor: invSpotColor, shadowColor: invSpotColor, shadowOpacity: 0.5, shadowRadius: 12, elevation: 10 },
              longMenuOpen && !isFireReady && { backgroundColor: COLORS.dark.accentDim, borderColor: COLORS.dark.accent, opacity: 1 },
            ]}
          >
            <RNAnimated.View style={{ transform: [{ scale: fireScale }, { translateY: fireY }] }}>
              <Feather
                name={selectedInventorySpot ? (SPOT_ICONS[selectedInventorySpot.type] as any) : "zap"}
                size={24}
                color={isFireReady ? "#fff" : COLORS.dark.textMuted}
              />
            </RNAnimated.View>
            {isFireReady && miningClicks > 0 && !longMenuOpen && (
              <View style={[styles.mineProgressBadge, { borderColor: invSpotColor }]}>
                <Text style={[styles.mineProgressText, { color: invSpotColor }]}>{miningClicks}x</Text>
              </View>
            )}
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.fireLabel,
                { color: isFireReady ? "#fff" : COLORS.dark.textMuted },
                selectedInventorySpot && { letterSpacing: 0 },
              ]}
            >
              {selectedInventorySpot
                ? SPOT_LABELS[selectedInventorySpot.type] ?? selectedInventorySpot.type.toUpperCase()
                : isInspecting ? "ATK" : "FIRE"}
            </Text>
          </View>

          {longMenuOpen && (
            <RNAnimated.View
              pointerEvents="none"
              style={[
                styles.longPressMenu,
                {
                  opacity: menuAnim,
                  transform: [
                    {
                      scale: menuAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.88, 1],
                      }),
                    },
                    {
                      translateY: menuAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {menuItems.map((menuItem, idx) => {
                const isHovered = hoveredIndex === idx;
                return (
                  <View
                    key={menuItem.id}
                    style={[
                      styles.longPressMenuItem,
                      {
                        borderColor: menuItem.color + (isHovered ? "CC" : "44"),
                        backgroundColor: isHovered ? menuItem.color + "26" : COLORS.dark.card,
                      },
                      isHovered && styles.longPressMenuItemHovered,
                    ]}
                  >
                    <View style={[styles.longPressMenuItemIcon, { backgroundColor: menuItem.color + "22" }]}>
                      <Feather name={menuItem.icon as any} size={15} color={menuItem.color} />
                    </View>
                    <View style={styles.longPressMenuItemText}>
                      <Text
                        style={[styles.longPressMenuItemLabel, { color: isHovered ? menuItem.color : COLORS.dark.text }]}
                        numberOfLines={1}
                      >
                        {menuItem.label}
                      </Text>
                      <Text style={styles.longPressMenuItemSub} numberOfLines={1}>
                        {menuItem.sublabel}
                      </Text>
                    </View>
                    {menuItem.qty !== undefined && menuItem.qty > 1 && (
                      <View style={[styles.longPressMenuItemQtyBadge, { backgroundColor: menuItem.color + "22", borderColor: menuItem.color + "55" }]}>
                        <Text style={[styles.longPressMenuItemQtyText, { color: menuItem.color }]}>×{menuItem.qty}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </RNAnimated.View>
          )}
        </View>

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
          {/* Header */}
          <View style={styles.bagHeader}>
            <View style={styles.bagTitleRow}>
              <Text style={styles.bagTitle}>
                {isInspecting ? `SpotBag de ${selectedUser.name}` : "SpotBag"}
              </Text>
              {isInspecting && (
                <View style={styles.readOnlyBadge}>
                  <Feather name="eye" size={10} color={COLORS.dark.warning} />
                  <Text style={styles.readOnlyText}>somente leitura</Text>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
              {!isInspecting && (
                <View style={styles.labBtn}>
                  <Ionicons name="flask-outline" size={13} color="#7eefc4" />
                  <Text style={styles.labBtnText}>Lab</Text>
                </View>
              )}
              <Pressable onPress={() => sheetRef.current?.dismiss()} style={styles.closeBtn}>
                <Feather name="x" size={18} color={COLORS.dark.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={styles.legendManipulatedDot}>
                <Ionicons name="flask-outline" size={9} color="#7eefc4" />
              </View>
              <Text style={styles.legendText}>Manipulado</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.legendQtyDot}>
                <Text style={styles.legendQtyText}>×N</Text>
              </View>
              <Text style={styles.legendText}>Quantidade</Text>
            </View>
          </View>

          {/* Grid */}
          <View style={styles.gridContainer}>
            {collectedSpots.map((spot) => (
              <GridSpotItem
                key={spot.id}
                spot={spot}
                isFireSelected={selectedInventorySpot?.id === spot.id}
                onPress={setSelectedBagSpot}
                onLongSelect={handleLongSelectSpot}
                cardWidth={cardWidth}
              />
            ))}
            {displayBag
              .filter((i) => i.quantity > 0 && !SPOT_TYPES.includes(i.type))
              .map((item) => (
                <GridFullItem
                  key={item.id}
                  item={item}
                  onUse={handleUseItem}
                  readOnly={isInspecting}
                  cardWidth={cardWidth}
                />
              ))}
          </View>

          {isEmpty && (
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
    zIndex: 51,
    overflow: "visible",
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
    overflow: "visible",
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
    fontSize: 7,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.accent,
    letterSpacing: 1,
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
    alignItems: "flex-start",
    marginBottom: 10,
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 2,
  },
  labBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#0d2b21",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2aab6c55",
  },
  labBtnText: {
    color: "#7eefc4",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
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
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  legendRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ffffff08",
    marginBottom: 14,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendManipulatedDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#0d2b21",
    borderWidth: 1,
    borderColor: "#2aab6c44",
    alignItems: "center",
    justifyContent: "center",
  },
  legendQtyDot: {
    backgroundColor: "#0008",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  legendQtyText: {
    color: COLORS.dark.text,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
  legendText: {
    color: COLORS.dark.textMuted,
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  newGridCard: {
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    gap: 6,
    position: "relative",
    borderWidth: 1.5,
    overflow: "visible",
  },
  manipulatedBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#0d2b21",
    borderWidth: 1,
    borderColor: "#2aab6c44",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  qtyBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: "#1e1b4b",
    borderWidth: 1.5,
    borderColor: "#6366f1",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    zIndex: 10,
  },
  qtyBadgeText: {
    color: "#a5b4fc",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  newGridCardIcon: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  newGridCardName: {
    fontSize: 11.5,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.dark.text,
    textAlign: "center",
    lineHeight: 15,
    letterSpacing: 0.2,
  },
  newGridCardTypePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  newGridCardTypeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
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
  fireBtn: {
    alignItems: "center",
    gap: 4,
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.dark.card,
    borderWidth: 2,
    borderColor: COLORS.dark.border,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    position: "relative",
  },
  fireLabel: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.textMuted,
    letterSpacing: 1.5,
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
  spotBadgeStrip: {
    flexDirection: "row",
    gap: 3,
    marginTop: 2,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  spotBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
  },
  quickBadgeGroup: {
    position: "absolute",
    top: -4,
    right: -4,
    flexDirection: "row",
    gap: 2,
  },
  quickBadgeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: COLORS.dark.bg,
  },
  fireBtnWrapper: {
    position: "relative",
    overflow: "visible",
  },
  longPressMenu: {
    position: "absolute",
    right: 0,
    bottom: FIRE_BTN_HEIGHT + LONG_MENU_GAP_FROM_BTN,
    width: LONG_MENU_ITEM_WIDTH,
    gap: LONG_MENU_ITEM_GAP,
    zIndex: 100,
  },
  longPressMenuItem: {
    height: LONG_MENU_ITEM_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 9,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
  longPressMenuItemHovered: {
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 10,
  },
  longPressMenuItemIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  longPressMenuItemText: {
    flex: 1,
    gap: 1,
  },
  longPressMenuItemLabel: {
    fontSize: 11.5,
    fontFamily: "Inter_600SemiBold",
  },
  longPressMenuItemSub: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: COLORS.dark.textMuted,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  longPressMenuItemQtyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  longPressMenuItemQtyText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
  longPressMenuHoverDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    flexShrink: 0,
  },
});
