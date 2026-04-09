import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SPOT_DAMAGE,
  SubstanceType,
  SpotType,
  useGame,
} from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";
import { RadialMenu, RadialSlot } from "@/components/RadialMenu";

const LONG_PRESS_DELAY = 480;
const SLOT_RADIUS = 105;
const HOVER_THRESHOLD = 40;

const SPOT_COLORS: Record<string, string> = {
  coupon: "#C97400",
  money: "#5D8A20",
  product: "#1A6B9A",
  rare: "#7A5CB0",
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

const ITEM_COLORS: Record<string, string> = {
  flame_shield: "#7A5CB0",
  cryo_armor: "#1A6B9A",
  volt_ward: "#C97400",
  antidote: "#5D8A20",
  barrier: "#5D8A20",
};

const ITEM_ICONS: Record<string, string> = {
  flame_shield: "shield",
  cryo_armor: "shield",
  volt_ward: "shield",
  antidote: "plus-circle",
  barrier: "shield",
};

const DEF_LABELS: Record<string, string> = {
  flame_shield: "ESCUDO",
  cryo_armor: "ARMADURA",
  volt_ward: "PROTEÇÃO",
  antidote: "ANTÍDOTO",
  barrier: "BARREIRA",
};

const DEF_DESCRIPTIONS: Record<string, string> = {
  flame_shield: "Imunidade ao próximo ataque de Fogo",
  cryo_armor: "Imunidade ao próximo ataque de Gelo",
  volt_ward: "Imunidade ao próximo ataque de Raio",
  antidote: "Remove envenenamento ativo e cura",
  barrier: "Absorve qualquer tipo de dano recebido",
};

const DEF_IMPACT: Record<string, string> = {
  flame_shield: "+IMUN. FOGO",
  cryo_armor: "+IMUN. GELO",
  volt_ward: "+IMUN. RAIO",
  antidote: "CURA VENENO",
  barrier: "+50 ABSORÇÃO",
};

const SUBSTANCE_TYPES: SubstanceType[] = [
  "flame_shield",
  "cryo_armor",
  "volt_ward",
  "antidote",
  "barrier",
];

function getSlotPositions(
  center: { x: number; y: number },
  count: number,
  openLeft: boolean
): { x: number; y: number }[] {
  if (count === 0) return [];
  const arcCenter = openLeft ? 225 : 315;
  const spread = count === 1 ? 0 : Math.min(115, count * 28);
  const startAngle = arcCenter - spread / 2;
  const step = count > 1 ? spread / (count - 1) : 0;
  return Array.from({ length: count }, (_, i) => {
    const rad = ((startAngle + i * step) * Math.PI) / 180;
    return {
      x: center.x + SLOT_RADIUS * Math.cos(rad),
      y: center.y + SLOT_RADIUS * Math.sin(rad),
    };
  });
}

function findHoveredSlot(
  pos: { x: number; y: number },
  positions: { x: number; y: number }[]
): number | null {
  let minDist = Infinity;
  let minIdx: number | null = null;
  positions.forEach((p, i) => {
    const d = Math.sqrt((pos.x - p.x) ** 2 + (pos.y - p.y) ** 2);
    if (d < minDist) { minDist = d; minIdx = i; }
  });
  return minDist <= HOVER_THRESHOLD ? minIdx : null;
}

interface CombatButtonsProps {
  insets: { bottom: number };
  onAttack?: () => void;
  onDefend?: () => void;
  canAttack?: boolean;
  miningClicks?: number;
  extraBottomOffset?: number;
}

export function CombatButtons({
  insets,
  onAttack,
  onDefend,
  canAttack = false,
  miningClicks = 0,
  extraBottomOffset = 0,
}: CombatButtonsProps) {
  const C = useColors();
  const {
    selectedUser,
    selectedInventorySpot,
    collectedSpots,
    userProfile,
    selectInventorySpot,
    useSubstance,
  } = useGame();

  const bottomAnim = useRef(new RNAnimated.Value(extraBottomOffset)).current;
  useEffect(() => {
    RNAnimated.spring(bottomAnim, {
      toValue: extraBottomOffset,
      useNativeDriver: false,
      tension: 70,
      friction: 11,
    }).start();
  }, [extraBottomOffset]);

  const atkScale = useRef(new RNAnimated.Value(1)).current;
  const atkY = useRef(new RNAnimated.Value(0)).current;
  const defScale = useRef(new RNAnimated.Value(1)).current;

  const atkColor = selectedInventorySpot
    ? (SPOT_COLORS[selectedInventorySpot.type] ?? C.accent)
    : selectedUser ? C.danger : C.accent;

  const atkIcon = selectedInventorySpot
    ? (SPOT_ICONS[selectedInventorySpot.type] ?? "zap")
    : "zap";

  const atkLabel = selectedInventorySpot
    ? (SPOT_LABELS[selectedInventorySpot.type] ?? selectedInventorySpot.type.toUpperCase())
    : selectedUser ? "ATK" : "ATK";

  const defColor = C.purple;

  const animateAtk = () => {
    RNAnimated.parallel([
      RNAnimated.sequence([
        RNAnimated.timing(atkScale, { toValue: 0.75, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(atkScale, { toValue: 1.1, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(atkScale, { toValue: 1, duration: 60, useNativeDriver: true }),
      ]),
      RNAnimated.sequence([
        RNAnimated.timing(atkY, { toValue: -8, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(atkY, { toValue: 2, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(atkY, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const animateDef = () => {
    RNAnimated.sequence([
      RNAnimated.timing(defScale, { toValue: 0.75, duration: 80, useNativeDriver: true }),
      RNAnimated.timing(defScale, { toValue: 1.1, duration: 80, useNativeDriver: true }),
      RNAnimated.timing(defScale, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ─── ATK radial menu state ────────────────────────────────────────────────
  const [atkMenuVisible, setAtkMenuVisible] = useState(false);
  const [atkHoveredIndex, setAtkHoveredIndex] = useState<number | null>(null);
  const [atkButtonCenter, setAtkButtonCenter] = useState({ x: 0, y: 0 });

  const atkMenuVisibleRef = useRef(false);
  const atkIsLongPressRef = useRef(false);
  const atkLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const atkHoveredIndexRef = useRef<number | null>(null);
  const atkButtonCenterRef = useRef({ x: 0, y: 0 });
  const atkSlotPositionsRef = useRef<{ x: number; y: number }[]>([]);
  const atkSlotsRef = useRef<RadialSlot[]>([]);
  const atkBtnRef = useRef<View>(null);

  // ─── DEF radial menu state ────────────────────────────────────────────────
  const [defMenuVisible, setDefMenuVisible] = useState(false);
  const [defHoveredIndex, setDefHoveredIndex] = useState<number | null>(null);
  const [defButtonCenter, setDefButtonCenter] = useState({ x: 0, y: 0 });

  const defMenuVisibleRef = useRef(false);
  const defIsLongPressRef = useRef(false);
  const defLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defHoveredIndexRef = useRef<number | null>(null);
  const defButtonCenterRef = useRef({ x: 0, y: 0 });
  const defSlotPositionsRef = useRef<{ x: number; y: number }[]>([]);
  const defSlotsRef = useRef<RadialSlot[]>([]);
  const defBtnRef = useRef<View>(null);

  // ─── Build slot arrays (must stay in sync with refs) ────────────────────
  const buildAtkSlots = (): RadialSlot[] =>
    collectedSpots.map((spot) => ({
      id: spot.id,
      label: SPOT_LABELS[spot.type] ?? spot.type.toUpperCase(),
      color: SPOT_COLORS[spot.type] ?? C.accent,
      icon: SPOT_ICONS[spot.type] ?? "zap",
      previewName: spot.title,
      previewType: SPOT_LABELS[spot.type] ?? spot.type,
      previewDescription: `Spot ${SPOT_LABELS[spot.type]?.toLowerCase() ?? spot.type} — use como arma ou colete no mapa`,
      previewImpact: `${SPOT_DAMAGE[spot.type as SpotType] ?? 10} DMG`,
      previewTarget: selectedUser ? "Oponente" : "Spot",
      previewImageUrl: spot.imageUrl,
    }));

  const buildDefSlots = (): RadialSlot[] =>
    userProfile.bag
      .filter(
        (item) =>
          item.quantity > 0 &&
          SUBSTANCE_TYPES.includes(item.type as SubstanceType)
      )
      .map((item) => ({
        id: item.type,
        label: DEF_LABELS[item.type] ?? item.type.toUpperCase(),
        color: ITEM_COLORS[item.type] ?? defColor,
        icon: ITEM_ICONS[item.type] ?? "shield",
        previewName: item.name,
        previewType: DEF_LABELS[item.type] ?? item.type,
        previewDescription: DEF_DESCRIPTIONS[item.type] ?? "Item defensivo",
        previewImpact: DEF_IMPACT[item.type] ?? "+DEF",
        previewTarget: "Você",
        quantity: item.quantity,
      }));

  // ─── ATK PanResponder ─────────────────────────────────────────────────────
  const atkPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        atkIsLongPressRef.current = false;
        atkScale.setValue(0.9);

        atkBtnRef.current?.measure((_, __, w, h, pageX, pageY) => {
          const center = { x: pageX + w / 2, y: pageY + h / 2 };
          atkButtonCenterRef.current = center;

          const slots = buildAtkSlots();
          atkSlotsRef.current = slots;

          if (slots.length > 0) {
            atkSlotPositionsRef.current = getSlotPositions(center, slots.length, true);
          }
        });

        atkLongPressTimer.current = setTimeout(() => {
          atkIsLongPressRef.current = true;
          atkMenuVisibleRef.current = true;

          setAtkButtonCenter({ ...atkButtonCenterRef.current });
          setAtkMenuVisible(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, LONG_PRESS_DELAY);
      },

      onPanResponderMove: (e) => {
        if (!atkMenuVisibleRef.current) return;
        const pos = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        const idx = findHoveredSlot(pos, atkSlotPositionsRef.current);
        if (idx !== atkHoveredIndexRef.current) {
          atkHoveredIndexRef.current = idx;
          setAtkHoveredIndex(idx);
          if (idx !== null) Haptics.selectionAsync();
        }
      },

      onPanResponderRelease: () => {
        if (atkLongPressTimer.current) clearTimeout(atkLongPressTimer.current);
        atkScale.setValue(1);

        if (!atkIsLongPressRef.current) {
          if (canAttack) {
            animateAtk();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onAttack?.();
          }
        } else {
          const idx = atkHoveredIndexRef.current;
          if (idx !== null) {
            const slot = atkSlotsRef.current[idx];
            const spot = collectedSpots.find((s) => s.id === slot.id);
            if (spot) {
              selectInventorySpot(spot);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
          setAtkMenuVisible(false);
          atkMenuVisibleRef.current = false;
          setAtkHoveredIndex(null);
          atkHoveredIndexRef.current = null;
        }

        atkIsLongPressRef.current = false;
      },

      onPanResponderTerminate: () => {
        if (atkLongPressTimer.current) clearTimeout(atkLongPressTimer.current);
        atkScale.setValue(1);
        setAtkMenuVisible(false);
        atkMenuVisibleRef.current = false;
        setAtkHoveredIndex(null);
        atkHoveredIndexRef.current = null;
        atkIsLongPressRef.current = false;
      },
    })
  ).current;

  // ─── DEF PanResponder ─────────────────────────────────────────────────────
  const defPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        defIsLongPressRef.current = false;
        defScale.setValue(0.9);

        defBtnRef.current?.measure((_, __, w, h, pageX, pageY) => {
          const center = { x: pageX + w / 2, y: pageY + h / 2 };
          defButtonCenterRef.current = center;

          const slots = buildDefSlots();
          defSlotsRef.current = slots;

          if (slots.length > 0) {
            defSlotPositionsRef.current = getSlotPositions(center, slots.length, false);
          }
        });

        defLongPressTimer.current = setTimeout(() => {
          defIsLongPressRef.current = true;
          defMenuVisibleRef.current = true;

          setDefButtonCenter({ ...defButtonCenterRef.current });
          setDefMenuVisible(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, LONG_PRESS_DELAY);
      },

      onPanResponderMove: (e) => {
        if (!defMenuVisibleRef.current) return;
        const pos = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY };
        const idx = findHoveredSlot(pos, defSlotPositionsRef.current);
        if (idx !== defHoveredIndexRef.current) {
          defHoveredIndexRef.current = idx;
          setDefHoveredIndex(idx);
          if (idx !== null) Haptics.selectionAsync();
        }
      },

      onPanResponderRelease: () => {
        if (defLongPressTimer.current) clearTimeout(defLongPressTimer.current);
        defScale.setValue(1);

        if (!defIsLongPressRef.current) {
          animateDef();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDefend?.();
        } else {
          const idx = defHoveredIndexRef.current;
          if (idx !== null) {
            const slot = defSlotsRef.current[idx];
            if (SUBSTANCE_TYPES.includes(slot.id as SubstanceType)) {
              useSubstance(slot.id as SubstanceType);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
          setDefMenuVisible(false);
          defMenuVisibleRef.current = false;
          setDefHoveredIndex(null);
          defHoveredIndexRef.current = null;
        }

        defIsLongPressRef.current = false;
      },

      onPanResponderTerminate: () => {
        if (defLongPressTimer.current) clearTimeout(defLongPressTimer.current);
        defScale.setValue(1);
        setDefMenuVisible(false);
        defMenuVisibleRef.current = false;
        setDefHoveredIndex(null);
        defHoveredIndexRef.current = null;
        defIsLongPressRef.current = false;
      },
    })
  ).current;

  const atkSlots = buildAtkSlots();
  const defSlots = buildDefSlots();

  const atkSlotPositions = getSlotPositions(atkButtonCenter, atkSlots.length, true);
  const defSlotPositions = getSlotPositions(defButtonCenter, defSlots.length, false);

  return (
    <>
      {/* ATK Radial Menu */}
      {atkMenuVisible && (
        <RadialMenu
          visible={atkMenuVisible}
          slots={atkSlots}
          slotPositions={atkSlotPositions}
          hoveredIndex={atkHoveredIndex}
          previewOnLeft={true}
          topInset={60}
        />
      )}

      {/* DEF Radial Menu */}
      {defMenuVisible && (
        <RadialMenu
          visible={defMenuVisible}
          slots={defSlots}
          slotPositions={defSlotPositions}
          hoveredIndex={defHoveredIndex}
          previewOnLeft={false}
          topInset={60}
        />
      )}

      {/* DEF — esquerda */}
      <RNAnimated.View
        style={[styles.leftContainer, { bottom: RNAnimated.add(insets.bottom + 16, bottomAnim) }]}
      >
        <View ref={defBtnRef} {...defPan.panHandlers}>
          <RNAnimated.View
            style={[
              styles.btn,
              {
                backgroundColor: defColor + "18",
                borderColor: defSlots.length > 0 ? defColor + "88" : defColor + "44",
                borderWidth: 1.5,
                transform: [{ scale: defScale }],
              },
            ]}
          >
            <Feather name="shield" size={26} color={defColor} />
            <Text style={[styles.label, { color: defColor }]}>DEF</Text>
            {defSlots.length > 0 && (
              <View style={[styles.holdHint, { borderColor: defColor + "55" }]}>
                <Feather name="more-horizontal" size={8} color={defColor + "AA"} />
              </View>
            )}
          </RNAnimated.View>
        </View>
      </RNAnimated.View>

      {/* ATK — direita */}
      <RNAnimated.View
        style={[styles.rightContainer, { bottom: RNAnimated.add(insets.bottom + 16, bottomAnim) }]}
      >
        <View ref={atkBtnRef} {...atkPan.panHandlers}>
          <RNAnimated.View
            style={[
              styles.btn,
              {
                backgroundColor: canAttack ? atkColor + "22" : C.card,
                borderColor: canAttack ? atkColor : C.border,
                borderWidth: canAttack ? 2 : 1.5,
                transform: [{ scale: atkScale }, { translateY: atkY }],
              },
              canAttack && {
                shadowColor: atkColor,
                shadowOpacity: 0.45,
                shadowRadius: 12,
                elevation: 10,
              },
            ]}
          >
            <RNAnimated.View style={{ transform: [{ translateY: atkY }] }}>
              <Feather
                name={atkIcon as any}
                size={canAttack ? 24 : 26}
                color={canAttack ? atkColor : C.textMuted}
              />
            </RNAnimated.View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.label,
                { color: canAttack ? atkColor : C.textMuted },
                selectedInventorySpot && { letterSpacing: 0 },
              ]}
            >
              {atkLabel}
            </Text>
            {canAttack && miningClicks > 0 && (
              <View style={[styles.minesBadge, { backgroundColor: C.bg, borderColor: atkColor }]}>
                <Text style={[styles.minesBadgeText, { color: atkColor }]}>{miningClicks}x</Text>
              </View>
            )}
            {atkSlots.length > 0 && (
              <View style={[styles.holdHint, { borderColor: atkColor + "55" }]}>
                <Feather name="more-horizontal" size={8} color={atkColor + "AA"} />
              </View>
            )}
          </RNAnimated.View>
        </View>
      </RNAnimated.View>
    </>
  );
}

const styles = StyleSheet.create({
  leftContainer: {
    position: "absolute",
    left: 16,
    zIndex: 20,
  },
  rightContainer: {
    position: "absolute",
    right: 16,
    zIndex: 20,
  },
  btn: {
    width: 68,
    height: 68,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    gap: 3,
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  minesBadge: {
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
  minesBadgeText: {
    fontSize: 9,
    fontWeight: "700",
  },
  holdHint: {
    position: "absolute",
    bottom: -2,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
});
