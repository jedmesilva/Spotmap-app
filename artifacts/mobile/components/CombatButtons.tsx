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

// ─── Constants ────────────────────────────────────────────────────────────────
const LONG_PRESS_DELAY  = 480;
const MAX_RADIAL_SLOTS  = 12;
const DEAD_ZONE         = 52;   // px from button center — no selection inside
const VISIBLE_ARC       = 150;  // degrees of visible arc
const SCROLL_ZONE_ARC   = 12;   // degrees at each edge that trigger scroll
const SCROLL_SPEED_MIN  = 0.5;  // degrees per tick at zone edge
const SCROLL_SPEED_MAX  = 4.0;  // degrees per tick at zone center
const SCROLL_TICK_MS    = 16;   // ~60 fps
const ATK_VIS_CENTER    = 225;  // arc faces upper-left (right-side button)
const DEF_VIS_CENTER    = 315;  // arc faces upper-right (left-side button)

// ─── Slot metadata ────────────────────────────────────────────────────────────
const SPOT_COLORS: Record<string, string> = {
  coupon: "#C97400", money: "#5D8A20", product: "#1A6B9A", rare: "#7A5CB0",
};
const SPOT_ICONS: Record<string, string> = {
  coupon: "tag", money: "dollar-sign", product: "box", rare: "star",
};
const SPOT_LABELS: Record<string, string> = {
  coupon: "CUPOM", money: "DINHEIRO", product: "PRODUTO", rare: "RARO",
};
const ITEM_COLORS: Record<string, string> = {
  flame_shield: "#7A5CB0", cryo_armor: "#1A6B9A", volt_ward: "#C97400",
  antidote: "#5D8A20", barrier: "#5D8A20",
};
const ITEM_ICONS: Record<string, string> = {
  flame_shield: "shield", cryo_armor: "shield", volt_ward: "shield",
  antidote: "plus-circle", barrier: "shield",
};
const DEF_LABELS: Record<string, string> = {
  flame_shield: "ESCUDO", cryo_armor: "ARMADURA", volt_ward: "PROTEÇÃO",
  antidote: "ANTÍDOTO", barrier: "BARREIRA",
};
const DEF_DESCRIPTIONS: Record<string, string> = {
  flame_shield: "Imunidade ao próximo ataque de Fogo",
  cryo_armor:   "Imunidade ao próximo ataque de Gelo",
  volt_ward:    "Imunidade ao próximo ataque de Raio",
  antidote:     "Remove envenenamento ativo e cura",
  barrier:      "Absorve qualquer tipo de dano recebido",
};
const DEF_IMPACT: Record<string, string> = {
  flame_shield: "+IMUN. FOGO", cryo_armor: "+IMUN. GELO", volt_ward: "+IMUN. RAIO",
  antidote: "CURA VENENO", barrier: "+50 ABSORÇÃO",
};
const SUBSTANCE_TYPES: SubstanceType[] = [
  "flame_shield", "cryo_armor", "volt_ward", "antidote", "barrier",
];

// ─── Geometry helpers ─────────────────────────────────────────────────────────
const toRad   = (d: number) => (d * Math.PI) / 180;
const toDeg   = (r: number) => (r * 180) / Math.PI;
const norm360 = (d: number) => ((d % 360) + 360) % 360;

function arcDelta(fromTop: number, visCenter: number): number {
  return norm360(fromTop - visCenter + 180) - 180;
}

function pointerAngle(
  touchX: number, touchY: number,
  center: { x: number; y: number },
): { dist: number; fromTop: number } {
  const dx = touchX - center.x;
  const dy = touchY - center.y;
  return {
    dist:    Math.sqrt(dx * dx + dy * dy),
    fromTop: norm360(toDeg(Math.atan2(dy, dx)) + 90),
  };
}

function getScrollZone(
  fromTop: number, visCenter: number,
): { dir: "prev" | "next"; t: number } | null {
  const d    = arcDelta(fromTop, visCenter);
  const absD = Math.abs(d);
  if (absD > VISIBLE_ARC / 2) return null;
  if (absD > VISIBLE_ARC / 2 - SCROLL_ZONE_ARC) {
    const depth = (VISIBLE_ARC / 2 - absD) / SCROLL_ZONE_ARC;
    return { dir: d < 0 ? "prev" : "next", t: 1 - depth };
  }
  return null;
}

function hitTestAngle(
  touchX: number, touchY: number,
  center: { x: number; y: number },
  offset: number, N: number, visCenter: number,
): number | null {
  if (N === 0) return null;
  const { dist, fromTop } = pointerAngle(touchX, touchY, center);
  if (dist < DEAD_ZONE) return null;
  if (Math.abs(arcDelta(fromTop, visCenter)) > VISIBLE_ARC / 2) return null;
  if (getScrollZone(fromTop, visCenter) !== null) return null;
  const SLICE   = 360 / N;
  const natural = norm360(fromTop - offset);
  return Math.floor(natural / SLICE) % N;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface CombatButtonsProps {
  insets: { bottom: number };
  onAttack?: () => void;
  onDefend?: () => void;
  canAttack?: boolean;
  miningClicks?: number;
  extraBottomOffset?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────
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
    selectedUser, selectedInventorySpot, collectedSpots, userProfile,
    selectInventorySpot, useSubstance,
  } = useGame();

  // ── Bottom animation ────────────────────────────────────────────────────
  const bottomAnim = useRef(new RNAnimated.Value(extraBottomOffset)).current;
  useEffect(() => {
    RNAnimated.spring(bottomAnim, {
      toValue: extraBottomOffset,
      useNativeDriver: false,
      tension: 70, friction: 11,
    }).start();
  }, [extraBottomOffset]);

  // ── Button animations ───────────────────────────────────────────────────
  const atkScale = useRef(new RNAnimated.Value(1)).current;
  const atkY     = useRef(new RNAnimated.Value(0)).current;
  const defScale = useRef(new RNAnimated.Value(1)).current;

  const atkColor = selectedInventorySpot
    ? (SPOT_COLORS[selectedInventorySpot.type] ?? C.accent)
    : selectedUser ? C.danger : C.accent;
  const atkIcon  = selectedInventorySpot ? (SPOT_ICONS[selectedInventorySpot.type] ?? "zap") : "zap";
  const atkLabel = selectedInventorySpot
    ? (SPOT_LABELS[selectedInventorySpot.type] ?? selectedInventorySpot.type.toUpperCase())
    : "ATK";
  const defColor = C.purple;

  const animateAtk = () => {
    RNAnimated.parallel([
      RNAnimated.sequence([
        RNAnimated.timing(atkScale, { toValue: 0.75, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(atkScale, { toValue: 1.1,  duration: 80, useNativeDriver: true }),
        RNAnimated.timing(atkScale, { toValue: 1,    duration: 60, useNativeDriver: true }),
      ]),
      RNAnimated.sequence([
        RNAnimated.timing(atkY, { toValue: -8, duration: 80, useNativeDriver: true }),
        RNAnimated.timing(atkY, { toValue: 2,  duration: 80, useNativeDriver: true }),
        RNAnimated.timing(atkY, { toValue: 0,  duration: 60, useNativeDriver: true }),
      ]),
    ]).start();
  };
  const animateDef = () => {
    RNAnimated.sequence([
      RNAnimated.timing(defScale, { toValue: 0.75, duration: 80, useNativeDriver: true }),
      RNAnimated.timing(defScale, { toValue: 1.1,  duration: 80, useNativeDriver: true }),
      RNAnimated.timing(defScale, { toValue: 1,    duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── Always-fresh refs ───────────────────────────────────────────────────
  const canAttackRef          = useRef(canAttack);          canAttackRef.current = canAttack;
  const onAttackRef           = useRef(onAttack);           onAttackRef.current = onAttack;
  const onDefendRef           = useRef(onDefend);           onDefendRef.current = onDefend;
  const selectInventorySpotRef = useRef(selectInventorySpot); selectInventorySpotRef.current = selectInventorySpot;
  const useSubstanceRef       = useRef(useSubstance);       useSubstanceRef.current = useSubstance;
  const collectedSpotsRef     = useRef(collectedSpots);     collectedSpotsRef.current = collectedSpots;
  const userProfileRef        = useRef(userProfile);        userProfileRef.current = userProfile;
  const selectedUserRef       = useRef(selectedUser);       selectedUserRef.current = selectedUser;

  // ── ATK menu state ──────────────────────────────────────────────────────
  const [atkMenuVisible,  setAtkMenuVisible]  = useState(false);
  const [atkHoveredIndex, setAtkHoveredIndex] = useState<number | null>(null);
  const [atkCenter,       setAtkCenter]       = useState({ x: 0, y: 0 });
  const [atkOffset,       setAtkOffset]       = useState(ATK_VIS_CENTER);

  const atkMenuVisibleRef    = useRef(false);
  const atkIsLongPressRef    = useRef(false);
  const atkLongPressTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const atkHoveredIndexRef   = useRef<number | null>(null);
  const atkButtonCenterRef   = useRef({ x: 0, y: 0 });
  const atkOffsetRef         = useRef(ATK_VIS_CENTER);
  const atkScrollZoneRef     = useRef<{ dir: "prev" | "next"; t: number } | null>(null);
  const atkScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const atkSlotsRef          = useRef<RadialSlot[]>([]);
  const atkBtnRef            = useRef<View>(null);

  // ── DEF menu state ──────────────────────────────────────────────────────
  const [defMenuVisible,  setDefMenuVisible]  = useState(false);
  const [defHoveredIndex, setDefHoveredIndex] = useState<number | null>(null);
  const [defCenter,       setDefCenter]       = useState({ x: 0, y: 0 });
  const [defOffset,       setDefOffset]       = useState(DEF_VIS_CENTER);

  const defMenuVisibleRef    = useRef(false);
  const defIsLongPressRef    = useRef(false);
  const defLongPressTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defHoveredIndexRef   = useRef<number | null>(null);
  const defButtonCenterRef   = useRef({ x: 0, y: 0 });
  const defOffsetRef         = useRef(DEF_VIS_CENTER);
  const defScrollZoneRef     = useRef<{ dir: "prev" | "next"; t: number } | null>(null);
  const defScrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const defSlotsRef          = useRef<RadialSlot[]>([]);
  const defBtnRef            = useRef<View>(null);

  // ── Scroll helpers ──────────────────────────────────────────────────────
  const stopAtkScroll = () => {
    if (atkScrollIntervalRef.current) {
      clearInterval(atkScrollIntervalRef.current);
      atkScrollIntervalRef.current = null;
    }
  };
  const stopDefScroll = () => {
    if (defScrollIntervalRef.current) {
      clearInterval(defScrollIntervalRef.current);
      defScrollIntervalRef.current = null;
    }
  };

  // ── Slot builders ───────────────────────────────────────────────────────
  const buildAtkSlots = (): RadialSlot[] =>
    collectedSpots.slice(0, MAX_RADIAL_SLOTS).map((spot) => ({
      id: spot.id,
      label:              SPOT_LABELS[spot.type] ?? spot.type.toUpperCase(),
      color:              SPOT_COLORS[spot.type] ?? C.accent,
      icon:               SPOT_ICONS[spot.type] ?? "zap",
      previewName:        spot.title,
      previewType:        SPOT_LABELS[spot.type] ?? spot.type,
      previewDescription: `Spot ${SPOT_LABELS[spot.type]?.toLowerCase() ?? spot.type} — use como arma ou colete no mapa`,
      previewImpact:      `${SPOT_DAMAGE[spot.type as SpotType] ?? 10} DMG`,
      previewTarget:      selectedUser ? "Oponente" : "Spot",
      previewImageUrl:    spot.imageUrl,
    }));

  const buildDefSlots = (): RadialSlot[] =>
    userProfile.bag
      .filter((item) => item.quantity > 0 && SUBSTANCE_TYPES.includes(item.type as SubstanceType))
      .slice(0, MAX_RADIAL_SLOTS)
      .map((item) => ({
        id:                 item.type,
        label:              DEF_LABELS[item.type] ?? item.type.toUpperCase(),
        color:              ITEM_COLORS[item.type] ?? defColor,
        icon:               ITEM_ICONS[item.type] ?? "shield",
        previewName:        item.name,
        previewType:        DEF_LABELS[item.type] ?? item.type,
        previewDescription: DEF_DESCRIPTIONS[item.type] ?? "Item defensivo",
        previewImpact:      DEF_IMPACT[item.type] ?? "+DEF",
        previewTarget:      "Você",
        quantity:           item.quantity,
      }));

  // ─── ATK PanResponder ────────────────────────────────────────────────────
  const atkPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: () => {
        atkIsLongPressRef.current = false;
        atkScale.setValue(0.9);

        atkBtnRef.current?.measure((_, __, w, h, pageX, pageY) => {
          const center = { x: pageX + w / 2, y: pageY + h / 2 };
          atkButtonCenterRef.current = center;

          const slots = collectedSpotsRef.current.slice(0, MAX_RADIAL_SLOTS).map((spot): RadialSlot => ({
            id:                 spot.id,
            label:              SPOT_LABELS[spot.type] ?? spot.type.toUpperCase(),
            color:              SPOT_COLORS[spot.type] ?? "#888",
            icon:               SPOT_ICONS[spot.type] ?? "zap",
            previewName:        spot.title,
            previewType:        SPOT_LABELS[spot.type] ?? spot.type,
            previewDescription: `Spot ${SPOT_LABELS[spot.type]?.toLowerCase() ?? spot.type} — use como arma ou colete no mapa`,
            previewImpact:      `${SPOT_DAMAGE[spot.type as SpotType] ?? 10} DMG`,
            previewTarget:      selectedUserRef.current ? "Oponente" : "Spot",
            previewImageUrl:    spot.imageUrl,
          }));
          atkSlotsRef.current = slots;

          // Initial offset: item 0 centered in arc
          atkOffsetRef.current = ATK_VIS_CENTER;
          setAtkOffset(ATK_VIS_CENTER);
          setAtkCenter({ ...center });
        });

        atkLongPressTimer.current = setTimeout(() => {
          atkIsLongPressRef.current  = true;
          atkMenuVisibleRef.current  = true;
          setAtkMenuVisible(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, LONG_PRESS_DELAY);
      },

      onPanResponderMove: (e) => {
        if (!atkMenuVisibleRef.current) return;
        const { pageX, pageY } = e.nativeEvent;
        const center           = atkButtonCenterRef.current;
        const N                = atkSlotsRef.current.length;

        const { fromTop } = pointerAngle(pageX, pageY, center);
        const zone        = getScrollZone(fromTop, ATK_VIS_CENTER);
        atkScrollZoneRef.current = zone;

        if (zone) {
          if (!atkScrollIntervalRef.current) {
            atkScrollIntervalRef.current = setInterval(() => {
              const z = atkScrollZoneRef.current;
              if (!z) return;
              const speed = SCROLL_SPEED_MIN + (SCROLL_SPEED_MAX - SCROLL_SPEED_MIN) * z.t;
              const delta = z.dir === "next" ? -speed : speed;
              atkOffsetRef.current = norm360(atkOffsetRef.current + delta);
              setAtkOffset(atkOffsetRef.current);
            }, SCROLL_TICK_MS);
          }
          if (atkHoveredIndexRef.current !== null) {
            atkHoveredIndexRef.current = null;
            setAtkHoveredIndex(null);
          }
        } else {
          stopAtkScroll();
          const idx = hitTestAngle(pageX, pageY, center, atkOffsetRef.current, N, ATK_VIS_CENTER);
          if (idx !== atkHoveredIndexRef.current) {
            atkHoveredIndexRef.current = idx;
            setAtkHoveredIndex(idx);
            if (idx !== null) Haptics.selectionAsync();
          }
        }
      },

      onPanResponderRelease: () => {
        if (atkLongPressTimer.current) clearTimeout(atkLongPressTimer.current);
        stopAtkScroll();
        atkScrollZoneRef.current = null;
        atkScale.setValue(1);

        if (!atkIsLongPressRef.current) {
          if (canAttackRef.current) {
            animateAtk();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onAttackRef.current?.();
          }
        } else {
          const idx = atkHoveredIndexRef.current;
          if (idx !== null) {
            const slot = atkSlotsRef.current[idx];
            const spot = slot && collectedSpotsRef.current.find((s) => s.id === slot.id);
            if (spot) {
              selectInventorySpotRef.current(spot);
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
        stopAtkScroll();
        atkScrollZoneRef.current = null;
        atkScale.setValue(1);
        setAtkMenuVisible(false);
        atkMenuVisibleRef.current = false;
        setAtkHoveredIndex(null);
        atkHoveredIndexRef.current = null;
        atkIsLongPressRef.current  = false;
      },
    })
  ).current;

  // ─── DEF PanResponder ────────────────────────────────────────────────────
  const defPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: () => {
        defIsLongPressRef.current = false;
        defScale.setValue(0.9);

        defBtnRef.current?.measure((_, __, w, h, pageX, pageY) => {
          const center = { x: pageX + w / 2, y: pageY + h / 2 };
          defButtonCenterRef.current = center;

          const slots = userProfileRef.current.bag
            .filter((item) => item.quantity > 0 && SUBSTANCE_TYPES.includes(item.type as SubstanceType))
            .slice(0, MAX_RADIAL_SLOTS)
            .map((item): RadialSlot => ({
              id:                 item.type,
              label:              DEF_LABELS[item.type] ?? item.type.toUpperCase(),
              color:              ITEM_COLORS[item.type] ?? "#888",
              icon:               ITEM_ICONS[item.type] ?? "shield",
              previewName:        item.name,
              previewType:        DEF_LABELS[item.type] ?? item.type,
              previewDescription: DEF_DESCRIPTIONS[item.type] ?? "Item defensivo",
              previewImpact:      DEF_IMPACT[item.type] ?? "+DEF",
              previewTarget:      "Você",
              quantity:           item.quantity,
            }));
          defSlotsRef.current = slots;

          defOffsetRef.current = DEF_VIS_CENTER;
          setDefOffset(DEF_VIS_CENTER);
          setDefCenter({ ...center });
        });

        defLongPressTimer.current = setTimeout(() => {
          defIsLongPressRef.current = true;
          defMenuVisibleRef.current = true;
          setDefMenuVisible(true);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }, LONG_PRESS_DELAY);
      },

      onPanResponderMove: (e) => {
        if (!defMenuVisibleRef.current) return;
        const { pageX, pageY } = e.nativeEvent;
        const center           = defButtonCenterRef.current;
        const N                = defSlotsRef.current.length;

        const { fromTop } = pointerAngle(pageX, pageY, center);
        const zone        = getScrollZone(fromTop, DEF_VIS_CENTER);
        defScrollZoneRef.current = zone;

        if (zone) {
          if (!defScrollIntervalRef.current) {
            defScrollIntervalRef.current = setInterval(() => {
              const z = defScrollZoneRef.current;
              if (!z) return;
              const speed = SCROLL_SPEED_MIN + (SCROLL_SPEED_MAX - SCROLL_SPEED_MIN) * z.t;
              const delta = z.dir === "next" ? -speed : speed;
              defOffsetRef.current = norm360(defOffsetRef.current + delta);
              setDefOffset(defOffsetRef.current);
            }, SCROLL_TICK_MS);
          }
          if (defHoveredIndexRef.current !== null) {
            defHoveredIndexRef.current = null;
            setDefHoveredIndex(null);
          }
        } else {
          stopDefScroll();
          const idx = hitTestAngle(pageX, pageY, center, defOffsetRef.current, N, DEF_VIS_CENTER);
          if (idx !== defHoveredIndexRef.current) {
            defHoveredIndexRef.current = idx;
            setDefHoveredIndex(idx);
            if (idx !== null) Haptics.selectionAsync();
          }
        }
      },

      onPanResponderRelease: () => {
        if (defLongPressTimer.current) clearTimeout(defLongPressTimer.current);
        stopDefScroll();
        defScrollZoneRef.current = null;
        defScale.setValue(1);

        if (!defIsLongPressRef.current) {
          animateDef();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDefendRef.current?.();
        } else {
          const idx = defHoveredIndexRef.current;
          if (idx !== null) {
            const slot = defSlotsRef.current[idx];
            if (slot && SUBSTANCE_TYPES.includes(slot.id as SubstanceType)) {
              useSubstanceRef.current(slot.id as SubstanceType);
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
        stopDefScroll();
        defScrollZoneRef.current = null;
        defScale.setValue(1);
        setDefMenuVisible(false);
        defMenuVisibleRef.current = false;
        setDefHoveredIndex(null);
        defHoveredIndexRef.current = null;
        defIsLongPressRef.current  = false;
      },
    })
  ).current;

  const atkSlots = buildAtkSlots();
  const defSlots = buildDefSlots();

  return (
    <>
      {atkMenuVisible && (
        <RadialMenu
          visible={atkMenuVisible}
          slots={atkSlots}
          center={atkCenter}
          offset={atkOffset}
          hoveredIndex={atkHoveredIndex}
          previewOnLeft={true}
          topInset={60}
          visCenter={ATK_VIS_CENTER}
        />
      )}

      {defMenuVisible && (
        <RadialMenu
          visible={defMenuVisible}
          slots={defSlots}
          center={defCenter}
          offset={defOffset}
          hoveredIndex={defHoveredIndex}
          previewOnLeft={false}
          topInset={60}
          visCenter={DEF_VIS_CENTER}
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
    position: "absolute", left: 16, zIndex: 20,
  },
  rightContainer: {
    position: "absolute", right: 16, zIndex: 20,
  },
  btn: {
    width: 68, height: 68, borderRadius: 4,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
    gap: 3,
  },
  label: {
    fontSize: 9, fontWeight: "700", letterSpacing: 0.8,
  },
  minesBadge: {
    position: "absolute", top: -5, right: -5,
    minWidth: 18, height: 18, borderRadius: 9,
    borderWidth: 1.5, alignItems: "center",
    justifyContent: "center", paddingHorizontal: 3,
  },
  minesBadgeText: {
    fontSize: 9, fontWeight: "700",
  },
  holdHint: {
    position: "absolute", bottom: -2, alignSelf: "center",
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1,
  },
});
