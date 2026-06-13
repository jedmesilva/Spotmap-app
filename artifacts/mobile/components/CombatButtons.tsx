import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  SPOT_DAMAGE,
  SubstanceType,
  SpotType,
  Spot,
  NearbyUser,
  InventoryItem,
  useGame,
} from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

export type ActionMode = "atk" | "farm" | "use";

const MODE_CONFIG: Record<ActionMode, { label: string; icon: string; desc: string }> = {
  atk:  { label: "ATK",  icon: "zap",        desc: "Atacar jogador ou spot" },
  farm: { label: "FARM", icon: "cpu",         desc: "Minerar spot selecionado" },
  use:  { label: "USE",  icon: "plus-circle", desc: "Usar item em si mesmo" },
};

const SPOT_COLORS: Record<string, string> = {
  coupon:  "#C97400",
  money:   "#5D8A20",
  product: "#1A6B9A",
  rare:    "#7A5CB0",
};
const SPOT_ICONS: Record<string, string> = {
  coupon:  "tag",
  money:   "dollar-sign",
  product: "box",
  rare:    "star",
};
const SPOT_LABELS: Record<string, string> = {
  coupon:  "CUPOM",
  money:   "DINHEIRO",
  product: "PRODUTO",
  rare:    "RARO",
};

const SUBSTANCE_TYPES: SubstanceType[] = [
  "flame_shield", "cryo_armor", "volt_ward", "antidote", "barrier",
];
const ITEM_COLORS: Record<string, string> = {
  flame_shield: "#7A5CB0",
  cryo_armor:   "#1A6B9A",
  volt_ward:    "#C97400",
  antidote:     "#5D8A20",
  barrier:      "#5D8A20",
};
const ITEM_ICONS: Record<string, string> = {
  flame_shield: "shield",
  cryo_armor:   "shield",
  volt_ward:    "shield",
  antidote:     "plus-circle",
  barrier:      "shield",
};
const ITEM_LABELS: Record<string, string> = {
  flame_shield: "ESCUDO FOGO",
  cryo_armor:   "ARMADURA GELO",
  volt_ward:    "PROTEÇÃO RAIO",
  antidote:     "ANTÍDOTO",
  barrier:      "BARREIRA",
};

const BTN_SIZE    = 68;
const RING_SIZE   = 110; // ring around the button (free-aim indicator)
const TOUCH_PAD   = 26;  // extra invisible touch area around button
const CONE_DEG    = 40;

function calcBearing(fromLat: number, fromLon: number, toLat: number, toLon: number): number {
  const φ1 = (fromLat * Math.PI) / 180;
  const φ2 = (toLat   * Math.PI) / 180;
  const Δλ = ((toLon - fromLon) * Math.PI) / 180;
  const y  = Math.sin(Δλ) * Math.cos(φ2);
  const x  = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function angleDiff(a: number, b: number): number {
  return Math.abs(((a - b + 540) % 360) - 180);
}

interface CombatButtonsProps {
  insets: { bottom: number };
  onAttack?: () => void;
  onFreeAimFire?: (userId: string | null, spotId: string | null) => void;
  onAimAngleChange?: (angle: number | null) => void;
  onUseItem?: (itemType: string) => void;
  onAimTarget?: (target: { userId?: string; spotId?: string } | null) => void;
  canAttack?: boolean;
  miningClicks?: number;
  extraBottomOffset?: number;
  userLocation?: { latitude: number; longitude: number } | null;
  nearbyUsers?: NearbyUser[];
  freeAimSpots?: Spot[];
}

export function CombatButtons({
  insets,
  onAttack,
  onFreeAimFire,
  onAimAngleChange,
  onUseItem,
  onAimTarget,
  canAttack = false,
  miningClicks = 0,
  extraBottomOffset = 0,
  userLocation,
  nearbyUsers = [],
  freeAimSpots = [],
}: CombatButtonsProps) {
  const C = useColors();
  const {
    selectedUser,
    selectedSpot,
    selectedInventorySpot,
    collectedSpots,
    userProfile,
    selectInventorySpot,
    useSubstance,
  } = useGame();

  // ── Mode & item selection ────────────────────────────────────────────────
  const [activeMode, setActiveMode] = useState<ActionMode>("atk");
  const [pickerMode, setPickerMode] = useState<ActionMode | null>(null);
  const [atkItem,  setAtkItem]  = useState<Spot | null>(null);
  const [farmItem, setFarmItem] = useState<Spot | null>(null);
  const [useItem,  setUseItem]  = useState<InventoryItem | null>(null);

  useEffect(() => {
    if (activeMode === "atk")  selectInventorySpot(atkItem  ?? null);
    if (activeMode === "farm") selectInventorySpot(farmItem ?? null);
    if (activeMode === "use")  selectInventorySpot(null);
  }, [activeMode, atkItem, farmItem]);

  // ── Free-aim state ───────────────────────────────────────────────────────
  const [isAiming,      setIsAiming]      = useState(false);
  const [hasAimTarget,  setHasAimTarget]  = useState(false);

  const isAimingRef       = useRef(false);
  const aimTargetRef      = useRef<{ userId?: string; spotId?: string } | null>(null);
  const hasLockedTarget   = useRef(false);

  // Animated values
  const btnScale    = useRef(new RNAnimated.Value(1)).current;
  const btnY        = useRef(new RNAnimated.Value(0)).current;
  const ringOpacity = useRef(new RNAnimated.Value(0)).current;
  const ringRotate  = useRef(new RNAnimated.Value(0)).current;
  const bottomAnim  = useRef(new RNAnimated.Value(extraBottomOffset)).current;

  useEffect(() => {
    RNAnimated.spring(bottomAnim, { toValue: extraBottomOffset, useNativeDriver: false, tension: 70, friction: 11 }).start();
  }, [extraBottomOffset]);

  useEffect(() => {
    hasLockedTarget.current = !!(selectedUser || selectedSpot);
  }, [selectedUser, selectedSpot]);

  // ── Refs to avoid stale closures ─────────────────────────────────────────
  const activeModeRef    = useRef(activeMode);
  const atkItemRef       = useRef(atkItem);
  const farmItemRef      = useRef(farmItem);
  const useItemRef       = useRef(useItem);
  const onAttackRef      = useRef(onAttack);
  const onFreeAimFireRef = useRef(onFreeAimFire);
  const useSubstanceRef  = useRef(useSubstance);
  const onUseItemRef     = useRef(onUseItem);
  const onAimTargetRef   = useRef(onAimTarget);
  // Props that change over time and are read inside PanResponder closures
  const nearbyUsersRef   = useRef(nearbyUsers);
  const freeAimSpotsRef  = useRef(freeAimSpots);
  const userLocationRef  = useRef(userLocation);

  useEffect(() => { activeModeRef.current    = activeMode;    }, [activeMode]);
  useEffect(() => { atkItemRef.current       = atkItem;       }, [atkItem]);
  useEffect(() => { farmItemRef.current      = farmItem;      }, [farmItem]);
  useEffect(() => { useItemRef.current       = useItem;       }, [useItem]);
  useEffect(() => { onAttackRef.current      = onAttack;      }, [onAttack]);
  useEffect(() => { onFreeAimFireRef.current = onFreeAimFire; }, [onFreeAimFire]);
  useEffect(() => { useSubstanceRef.current  = useSubstance;  }, [useSubstance]);
  useEffect(() => { onUseItemRef.current     = onUseItem;     }, [onUseItem]);
  useEffect(() => { onAimTargetRef.current   = onAimTarget;   }, [onAimTarget]);
  useEffect(() => { nearbyUsersRef.current   = nearbyUsers;   }, [nearbyUsers]);
  useEffect(() => { freeAimSpotsRef.current  = freeAimSpots;  }, [freeAimSpots]);
  useEffect(() => { userLocationRef.current  = userLocation;  }, [userLocation]);

  // ── Target cone detection ─────────────────────────────────────────────────
  // NOTE: This function is captured inside PanResponder (created once via useRef),
  // so it must read from refs — never from direct closure values — to avoid stale data.
  const findTargetInCone = (aimAngle: number) => {
    const loc   = userLocationRef.current;
    const users = nearbyUsersRef.current;
    const spots = freeAimSpotsRef.current;
    if (!loc) return null;
    let best: { userId?: string; spotId?: string } | null = null;
    let bestDist = Infinity;

    for (const u of users) {
      const bearing = calcBearing(loc.latitude, loc.longitude, u.latitude, u.longitude);
      if (angleDiff(bearing, aimAngle) <= CONE_DEG) {
        const d = Math.hypot(u.latitude - loc.latitude, u.longitude - loc.longitude);
        if (d < bestDist) { bestDist = d; best = { userId: u.id }; }
      }
    }
    for (const s of spots) {
      const bearing = calcBearing(loc.latitude, loc.longitude, s.latitude, s.longitude);
      if (angleDiff(bearing, aimAngle) <= CONE_DEG) {
        const d = Math.hypot(s.latitude - loc.latitude, s.longitude - loc.longitude);
        if (d < bestDist) { bestDist = d; best = { spotId: s.id }; }
      }
    }
    return best;
  };

  // ── Fire animations ───────────────────────────────────────────────────────
  const animateFire = () => {
    RNAnimated.sequence([
      RNAnimated.timing(btnScale, { toValue: 0.78, duration: 70, useNativeDriver: true }),
      RNAnimated.timing(btnScale, { toValue: 1.08, duration: 70, useNativeDriver: true }),
      RNAnimated.timing(btnScale, { toValue: 1,    duration: 60, useNativeDriver: true }),
    ]).start();
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  // Fire at locked target (onAttack callback)
  const doLockedAction = () => {
    animateFire();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const mode = activeModeRef.current;
    if ((mode === "atk" || mode === "farm") && (atkItemRef.current || farmItemRef.current)) {
      onAttackRef.current?.();
    } else if (mode === "use" && useItemRef.current) {
      if (SUBSTANCE_TYPES.includes(useItemRef.current.type as SubstanceType)) {
        useSubstanceRef.current(useItemRef.current.type as SubstanceType);
        onUseItemRef.current?.(useItemRef.current.type);
      }
    }
  };

  // Fire in free-aim direction — always fires, target may be null (shoots in the wind)
  const doFreeAimAction = () => {
    const target = aimTargetRef.current;
    animateFire();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFreeAimFireRef.current?.(target?.userId ?? null, target?.spotId ?? null);
  };

  // ── Long-press / fire timers ──────────────────────────────────────────────
  const holdTimer  = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const isHolding  = useRef(false);
  const pressStart = useRef(0);
  const MIN_TAP_MS = 80;

  const stopTimers = () => {
    if (pressTimer.current) { clearTimeout(pressTimer.current);  pressTimer.current = null; }
    if (holdTimer.current)  { clearInterval(holdTimer.current);  holdTimer.current  = null; }
    isHolding.current = false;
  };

  const onAimAngleChangeRef = useRef(onAimAngleChange);
  useEffect(() => { onAimAngleChangeRef.current = onAimAngleChange; }, [onAimAngleChange]);

  const showRing = (angle: number) => {
    isAimingRef.current = true;
    setIsAiming(true);
    onAimAngleChangeRef.current?.(angle);
    RNAnimated.spring(ringOpacity, { toValue: 1, useNativeDriver: true, tension: 180, friction: 8 }).start();
  };

  const hideRing = () => {
    isAimingRef.current = false;
    setIsAiming(false);
    aimTargetRef.current = null;
    setHasAimTarget(false);
    onAimAngleChangeRef.current?.(null);
    onAimTargetRef.current?.(null);
    RNAnimated.timing(ringOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
  };

  // Unified action: fire at locked target or free-aim (even with no target in cone)
  const doAction = () => {
    if (hasLockedTarget.current) doLockedAction();
    else doFreeAimAction();
  };

  // ── PanResponders ─────────────────────────────────────────────────────────

  // RING pan: drag anywhere on the ring area → only aims, never fires
  const ringPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: () => {
        // show ring immediately so user sees feedback
        showRing(0);
      },

      onPanResponderMove: (_, gs) => {
        const mag = Math.hypot(gs.dx, gs.dy);
        if (mag > 4) {
          const angle = ((Math.atan2(gs.dx, -gs.dy) * 180) / Math.PI + 360) % 360;
          ringRotate.setValue(angle);
          onAimAngleChangeRef.current?.(angle);
          const target = findTargetInCone(angle);
          aimTargetRef.current = target;
          setHasAimTarget(!!target);
          onAimTargetRef.current?.(target ?? null);
        }
      },

      onPanResponderRelease: () => {
        hideRing();
      },

      onPanResponderTerminate: () => {
        hideRing();
      },
    })
  ).current;

  // BUTTON pan: tap = fire once, hold = fire continuously, drag = fire + aim
  const mainPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: () => {
        pressStart.current = Date.now();
        isHolding.current  = false;
        RNAnimated.spring(btnScale, { toValue: 0.9, useNativeDriver: true, tension: 200, friction: 10 }).start();

        // Long-press: start continuous fire
        pressTimer.current = setTimeout(() => {
          isHolding.current = true;
          doAction();
          holdTimer.current = setInterval(doAction, 80);
        }, 480);
      },

      onPanResponderMove: (_, gs) => {
        const mag = Math.hypot(gs.dx, gs.dy);

        // Drag > 12px while on button = aim + fire
        if (mag > 12 && !hasLockedTarget.current) {
          const angle = ((Math.atan2(gs.dx, -gs.dy) * 180) / Math.PI + 360) % 360;
          ringRotate.setValue(angle);

          if (!isAimingRef.current) {
            // First drag: cancel hold timer, switch to continuous free-aim fire
            stopTimers();
            showRing(angle);
            doFreeAimAction();
            holdTimer.current = setInterval(doFreeAimAction, 80);
          } else {
            onAimAngleChangeRef.current?.(angle);
          }

          const target = findTargetInCone(angle);
          aimTargetRef.current = target;
          setHasAimTarget(!!target);
          onAimTargetRef.current?.(target ?? null);
        }
      },

      onPanResponderRelease: () => {
        RNAnimated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
        stopTimers();

        if (isAimingRef.current) {
          hideRing();
        } else {
          // Short tap: fire once
          const elapsed = Date.now() - pressStart.current;
          if (!isHolding.current && elapsed >= MIN_TAP_MS) doAction();
          isHolding.current = false;
        }
      },

      onPanResponderTerminate: () => {
        RNAnimated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
        stopTimers();
        if (isAimingRef.current) hideRing();
        isHolding.current = false;
      },
    })
  ).current;

  // ── Derived visuals ───────────────────────────────────────────────────────
  const canAct = (() => {
    if (activeMode === "atk")  return !!atkItem  && (!!selectedUser || canAttack);
    if (activeMode === "farm") return !!farmItem && canAttack;
    if (activeMode === "use")  return !!useItem;
    return false;
  })();

  const btnColor = (() => {
    if (activeMode === "atk")  return atkItem  ? (SPOT_COLORS[atkItem.type]  ?? C.accent) : C.accent;
    if (activeMode === "farm") return farmItem ? (SPOT_COLORS[farmItem.type] ?? C.accent) : C.accent;
    if (activeMode === "use")  return useItem  ? (ITEM_COLORS[useItem.type]  ?? C.purple) : C.purple;
    return C.accent;
  })();

  const btnIcon = (() => {
    if (activeMode === "atk")  return atkItem  ? (SPOT_ICONS[atkItem.type]  ?? "zap")        : "zap";
    if (activeMode === "farm") return farmItem ? (SPOT_ICONS[farmItem.type] ?? "cpu")        : "cpu";
    if (activeMode === "use")  return useItem  ? (ITEM_ICONS[useItem.type]  ?? "plus-circle") : "plus-circle";
    return "zap";
  })();

  const ringColor   = hasAimTarget ? "#ff5533" : "rgba(255,255,255,0.25)";
  const pointerColor = hasAimTarget ? "#ff5533" : "rgba(255,255,255,0.8)";

  const atkItems  = collectedSpots;
  const farmItems = collectedSpots;
  const useItems  = userProfile.bag.filter(
    (i) => i.quantity > 0 && SUBSTANCE_TYPES.includes(i.type as SubstanceType)
  );

  const getSlotForMode = (mode: ActionMode) => {
    if (mode === "atk")  return atkItem;
    if (mode === "farm") return farmItem;
    if (mode === "use")  return useItem;
    return null;
  };

  const MODES: ActionMode[] = ["atk", "farm", "use"];

  return (
    <>
      {/* Item picker modal */}
      <Modal
        visible={pickerMode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerMode(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerMode(null)}>
          <View style={[styles.pickerSheet, { backgroundColor: C.card, borderColor: C.border }]}>
            <Text style={[styles.pickerTitle, { color: C.text }]}>
              {pickerMode ? MODE_CONFIG[pickerMode].label : ""}
            </Text>
            <Text style={[styles.pickerSub, { color: C.textMuted }]}>
              {pickerMode ? MODE_CONFIG[pickerMode].desc : ""}
            </Text>
            <ScrollView style={styles.pickerList} showsVerticalScrollIndicator={false}>
              {pickerMode === "use"
                ? useItems.length === 0
                  ? <Text style={[styles.emptyText, { color: C.textMuted }]}>Nenhum item disponível</Text>
                  : useItems.map((item) => {
                      const color    = ITEM_COLORS[item.type] ?? C.purple;
                      const selected = useItem?.type === item.type;
                      return (
                        <Pressable
                          key={item.type}
                          style={[styles.pickerRow, {
                            borderColor:     selected ? color : C.border,
                            backgroundColor: selected ? color + "18" : C.surface,
                          }]}
                          onPress={() => {
                            setUseItem(item);
                            setPickerMode(null);
                            setActiveMode("use");
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                        >
                          <View style={[styles.pickerIcon, { backgroundColor: color + "22" }]}>
                            <Feather name={(ITEM_ICONS[item.type] ?? "package") as any} size={18} color={color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.pickerRowName, { color: C.text }]}>{item.name}</Text>
                            <Text style={[styles.pickerRowSub, { color }]}>{ITEM_LABELS[item.type] ?? item.type}</Text>
                          </View>
                          {item.quantity > 1 && <Text style={[styles.pickerQty, { color: C.textMuted }]}>×{item.quantity}</Text>}
                          {selected && <Feather name="check" size={14} color={color} />}
                        </Pressable>
                      );
                    })
                : (pickerMode === "atk" ? atkItems : farmItems).length === 0
                  ? <Text style={[styles.emptyText, { color: C.textMuted }]}>Nenhum spot coletado</Text>
                  : (pickerMode === "atk" ? atkItems : farmItems).map((spot) => {
                      const color       = SPOT_COLORS[spot.type] ?? C.accent;
                      const currentItem = pickerMode === "atk" ? atkItem : farmItem;
                      const selected    = currentItem?.id === spot.id;
                      return (
                        <Pressable
                          key={spot.id}
                          style={[styles.pickerRow, {
                            borderColor:     selected ? color : C.border,
                            backgroundColor: selected ? color + "18" : C.surface,
                          }]}
                          onPress={() => {
                            if (pickerMode === "atk")  setAtkItem(spot);
                            if (pickerMode === "farm") setFarmItem(spot);
                            setPickerMode(null);
                            setActiveMode(pickerMode!);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                        >
                          <View style={[styles.pickerIcon, { backgroundColor: color + "22" }]}>
                            <Feather name={(SPOT_ICONS[spot.type] ?? "package") as any} size={18} color={color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.pickerRowName, { color: C.text }]} numberOfLines={1}>{spot.title}</Text>
                            <Text style={[styles.pickerRowSub, { color }]}>
                              {SPOT_LABELS[spot.type] ?? spot.type} · {SPOT_DAMAGE[spot.type as SpotType] ?? "?"} DMG
                            </Text>
                          </View>
                          {selected && <Feather name="check" size={14} color={color} />}
                        </Pressable>
                      );
                    })
              }
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* ── SKILL CLUSTER LAYOUT ───────────────────────────────────────────── */}
      {/*
        Single RNAnimated.View covers the full bottom strip.
        Everything inside uses absolute positioning so each element is
        independently placed within the strip.
        - Left:  aim zone (ringPan — drag to aim, no fire)
        - Right: 3 skill buttons in an arc (ATK top, FARM mid-left, USE bottom)
        - Top-right: "Equipar" chip for the active slot
      */}
      <RNAnimated.View
        style={[styles.clusterStrip, { bottom: RNAnimated.add(insets.bottom + 16, bottomAnim) }]}
        pointerEvents="box-none"
      >

        {/* ── LEFT: AIM ZONE ─────────────────────────────────────────────── */}
        <View style={styles.aimZoneWrap} pointerEvents="box-none">
          {/* Static dashed ring */}
          <View style={[styles.aimStaticRing, { borderColor: C.border }]} />
          {/* Center knob */}
          <View style={[styles.aimKnob, { backgroundColor: C.surface, borderColor: C.border }]} />

          {/* Active ring + pointer (while aiming) */}
          <RNAnimated.View
            style={[
              styles.aimActiveRing,
              {
                opacity: ringOpacity,
                transform: [{
                  rotate: ringRotate.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] }),
                }],
              },
            ]}
            pointerEvents="none"
          >
            <View style={[styles.aimRing, { borderColor: ringColor }]} />
            <View style={[styles.aimPointer, { backgroundColor: pointerColor }]} />
          </RNAnimated.View>

          {/* Transparent touch overlay for ringPan */}
          <View style={StyleSheet.absoluteFillObject} {...ringPan.panHandlers} />
        </View>

        {/* ── TOP-RIGHT: EQUIP CHIP for active mode ──────────────────────── */}
        <TouchableOpacity
          style={[
            styles.equipChip,
            {
              borderColor:     btnColor + "55",
              backgroundColor: btnColor + "18",
            },
          ]}
          onPress={() => setPickerMode(activeMode)}
          activeOpacity={0.75}
        >
          <Feather name={btnIcon as any} size={11} color={btnColor} />
          <Text style={[styles.equipChipText, { color: btnColor }]} numberOfLines={1}>
            {(() => {
              const slot = getSlotForMode(activeMode);
              if (!slot) return "Equipar";
              if (activeMode === "use") return ITEM_LABELS[(slot as InventoryItem).type] ?? "Equipar";
              return SPOT_LABELS[(slot as Spot).type] ?? "Equipar";
            })()}
          </Text>
          <Feather name="chevron-up" size={10} color={btnColor + "bb"} />
        </TouchableOpacity>

        {/* ── RIGHT: 3 SKILL BUTTONS IN ARC ─────────────────────────────── */}
        {MODES.map((mode, idx) => {
          const cfg       = MODE_CONFIG[mode];
          const isActive  = activeMode === mode;
          const slot      = getSlotForMode(mode);
          const slotColor = slot
            ? (mode === "use"
                ? (ITEM_COLORS[(slot as InventoryItem).type] ?? C.purple)
                : (SPOT_COLORS[(slot as Spot).type]         ?? C.accent))
            : C.textMuted;
          const slotIcon  = slot
            ? (mode === "use"
                ? (ITEM_ICONS[(slot as InventoryItem).type]  ?? "package")
                : (SPOT_ICONS[(slot as Spot).type]           ?? "package"))
            : "plus";
          const canActNow = (() => {
            if (mode === "atk")  return !!atkItem  && (!!selectedUser || canAttack);
            if (mode === "farm") return !!farmItem && canAttack;
            if (mode === "use")  return !!useItem;
            return false;
          })();

          if (isActive) {
            // Active skill button — mainPan handles tap=fire, hold=fire, drag=aim+fire
            return (
              <RNAnimated.View
                key={mode}
                style={[
                  styles.skillBtnActive,
                  ARC_POS[idx],
                  {
                    borderColor:     canActNow ? slotColor : C.border,
                    backgroundColor: canActNow ? slotColor + "22" : C.card,
                    transform: [{ scale: btnScale }],
                    shadowColor:   canActNow ? slotColor : "#000",
                    shadowOpacity: canActNow ? 0.6 : 0.3,
                    elevation:     canActNow ? 12 : 4,
                  },
                ]}
              >
                <Feather
                  name={slotIcon as any}
                  size={24}
                  color={canActNow ? slotColor : C.textMuted}
                />
                <Text style={[styles.skillBtnLabel, { color: canActNow ? slotColor : C.textMuted }]}>
                  {cfg.label}
                </Text>
                {mode === "atk" && canActNow && miningClicks > 0 && (
                  <View style={[styles.badge, { backgroundColor: C.bg, borderColor: slotColor }]}>
                    <Text style={[styles.badgeText, { color: slotColor }]}>{miningClicks}x</Text>
                  </View>
                )}
                {/* Invisible touch-catcher — mainPan for fire + aim */}
                <View style={StyleSheet.absoluteFillObject} {...mainPan.panHandlers} />
              </RNAnimated.View>
            );
          }

          // Inactive skill button — tap = activate, long-press = open picker
          return (
            <TouchableOpacity
              key={mode}
              style={[
                styles.skillBtnInactive,
                ARC_POS[idx],
                {
                  borderColor:     slot ? slotColor + "66" : C.border,
                  backgroundColor: C.card,
                },
              ]}
              onPress={() => {
                setActiveMode(mode);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              onLongPress={() => {
                setActiveMode(mode);
                setPickerMode(mode);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              }}
              activeOpacity={0.7}
            >
              <Feather
                name={slotIcon as any}
                size={18}
                color={slot ? slotColor + "cc" : C.textMuted}
              />
              <Text style={[styles.skillBtnLabelSm, { color: slot ? slotColor + "cc" : C.textMuted }]}>
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </RNAnimated.View>
    </>
  );
}

// ── Arc positions (right / bottom offsets from clusterStrip) ──────────────────
// ATK = top of arc, FARM = mid-left, USE = bottom
const ARC_POS = [
  { position: "absolute" as const, right: 16, bottom: 158 }, // atk
  { position: "absolute" as const, right: 98, bottom: 86  }, // farm
  { position: "absolute" as const, right: 16, bottom: 16  }, // use
] as const;

const AIM_SIZE   = 108;
const ACTIVE_BTN = 78;
const INACTIVE_BTN = 60;

const styles = StyleSheet.create({
  // Full-width animated strip that anchors all controls to the bottom
  clusterStrip: {
    position:  "absolute",
    left:       0,
    right:      0,
    height:     280,
    zIndex:     20,
  },

  // ── Aim zone (left side) ───────────────────────────────────────────────────
  aimZoneWrap: {
    position:       "absolute",
    left:           16,
    bottom:         16,
    width:          AIM_SIZE,
    height:         AIM_SIZE,
    alignItems:     "center",
    justifyContent: "center",
  },
  aimStaticRing: {
    position:     "absolute",
    width:        AIM_SIZE,
    height:       AIM_SIZE,
    borderRadius: AIM_SIZE / 2,
    borderWidth:  1.5,
    borderStyle:  "dashed",
  },
  aimKnob: {
    width:        28,
    height:       28,
    borderRadius: 14,
    borderWidth:  1,
    alignItems:   "center",
    justifyContent: "center",
  },
  aimActiveRing: {
    position:   "absolute",
    width:      AIM_SIZE,
    height:     AIM_SIZE,
    alignItems: "center",
  },
  aimRing: {
    position:     "absolute",
    width:        AIM_SIZE,
    height:       AIM_SIZE,
    borderRadius: AIM_SIZE / 2,
    borderWidth:  1.5,
    borderStyle:  "dashed",
  },
  aimPointer: {
    position:     "absolute",
    top:          4,
    left:         AIM_SIZE / 2 - 5,
    width:        10,
    height:       10,
    borderRadius: 5,
  },

  // ── Equip chip (top-right, above cluster) ─────────────────────────────────
  equipChip: {
    position:          "absolute",
    right:             16,
    bottom:            248,
    flexDirection:     "row",
    alignItems:        "center",
    gap:               5,
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderRadius:      10,
    borderWidth:       1.5,
    maxWidth:          140,
  },
  equipChipText: {
    flex:          1,
    fontSize:      11,
    fontFamily:    "Inter_700Bold",
    letterSpacing: 0.5,
  },

  // ── Active skill button ────────────────────────────────────────────────────
  skillBtnActive: {
    width:          ACTIVE_BTN,
    height:         ACTIVE_BTN,
    borderRadius:   ACTIVE_BTN / 2,
    borderWidth:    2,
    alignItems:     "center",
    justifyContent: "center",
    gap:            3,
    shadowOffset:   { width: 0, height: 2 },
    shadowRadius:   14,
  },
  skillBtnLabel: {
    fontSize:      9,
    fontFamily:    "Inter_700Bold",
    letterSpacing: 0.8,
  },

  // ── Inactive skill button ─────────────────────────────────────────────────
  skillBtnInactive: {
    width:          INACTIVE_BTN,
    height:         INACTIVE_BTN,
    borderRadius:   INACTIVE_BTN / 2,
    borderWidth:    1.5,
    alignItems:     "center",
    justifyContent: "center",
    gap:            3,
    shadowColor:    "#000",
    shadowOffset:   { width: 0, height: 1 },
    shadowOpacity:  0.3,
    shadowRadius:   4,
    elevation:      3,
  },
  skillBtnLabelSm: {
    fontSize:      8,
    fontFamily:    "Inter_700Bold",
    letterSpacing: 0.7,
  },

  // ── Mining / use badge ────────────────────────────────────────────────────
  badge: {
    position:          "absolute",
    top:               -5,
    right:             -5,
    minWidth:          18,
    height:            18,
    borderRadius:      9,
    borderWidth:       1.5,
    alignItems:        "center",
    justifyContent:    "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize:   9,
    fontFamily: "Inter_700Bold",
  },

  // ── Item picker modal ─────────────────────────────────────────────────────
  modalBackdrop: {
    flex:            1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent:  "flex-end",
    padding:         16,
  },
  pickerSheet: {
    borderRadius: 16,
    borderWidth:  1.5,
    padding:      20,
    maxHeight:    420,
  },
  pickerTitle: {
    fontSize:      16,
    fontFamily:    "Inter_700Bold",
    letterSpacing: 0.5,
    marginBottom:  2,
  },
  pickerSub: {
    fontSize:     12,
    fontFamily:   "Inter_400Regular",
    marginBottom: 16,
  },
  pickerList: {
    flexGrow: 0,
  },
  pickerRow: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            12,
    padding:        10,
    borderRadius:   10,
    borderWidth:    1.5,
    marginBottom:   8,
  },
  pickerIcon: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     "center",
    justifyContent: "center",
  },
  pickerRowName: {
    fontSize:   13,
    fontFamily: "Inter_600SemiBold",
  },
  pickerRowSub: {
    fontSize:      10,
    fontFamily:    "Inter_700Bold",
    letterSpacing: 0.5,
    marginTop:     1,
  },
  pickerQty: {
    fontSize:    11,
    fontFamily:  "Inter_700Bold",
    marginRight: 4,
  },
  emptyText: {
    fontSize:        13,
    fontFamily:      "Inter_400Regular",
    textAlign:       "center",
    paddingVertical: 24,
  },
});
