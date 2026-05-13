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

  useEffect(() => { activeModeRef.current    = activeMode;    }, [activeMode]);
  useEffect(() => { atkItemRef.current       = atkItem;       }, [atkItem]);
  useEffect(() => { farmItemRef.current      = farmItem;      }, [farmItem]);
  useEffect(() => { useItemRef.current       = useItem;       }, [useItem]);
  useEffect(() => { onAttackRef.current      = onAttack;      }, [onAttack]);
  useEffect(() => { onFreeAimFireRef.current = onFreeAimFire; }, [onFreeAimFire]);
  useEffect(() => { useSubstanceRef.current  = useSubstance;  }, [useSubstance]);
  useEffect(() => { onUseItemRef.current     = onUseItem;     }, [onUseItem]);

  // ── Target cone detection ─────────────────────────────────────────────────
  const findTargetInCone = (aimAngle: number) => {
    if (!userLocation) return null;
    let best: { userId?: string; spotId?: string } | null = null;
    let bestDist = Infinity;

    for (const u of nearbyUsers) {
      const bearing = calcBearing(userLocation.latitude, userLocation.longitude, u.latitude, u.longitude);
      if (angleDiff(bearing, aimAngle) <= CONE_DEG) {
        const d = Math.hypot(u.latitude - userLocation.latitude, u.longitude - userLocation.longitude);
        if (d < bestDist) { bestDist = d; best = { userId: u.id }; }
      }
    }
    for (const s of freeAimSpots) {
      const bearing = calcBearing(userLocation.latitude, userLocation.longitude, s.latitude, s.longitude);
      if (angleDiff(bearing, aimAngle) <= CONE_DEG) {
        const d = Math.hypot(s.latitude - userLocation.latitude, s.longitude - userLocation.longitude);
        if (d < bestDist) { bestDist = d; best = { spotId: s.id }; }
      }
    }
    return best;
  };

  // ── Fire animations ───────────────────────────────────────────────────────
  const animateFire = () => {
    RNAnimated.parallel([
      RNAnimated.sequence([
        RNAnimated.timing(btnScale, { toValue: 0.78, duration: 70, useNativeDriver: true }),
        RNAnimated.timing(btnScale, { toValue: 1.08, duration: 70, useNativeDriver: true }),
        RNAnimated.timing(btnScale, { toValue: 1,    duration: 60, useNativeDriver: true }),
      ]),
      RNAnimated.sequence([
        RNAnimated.timing(btnY, { toValue: -8, duration: 70, useNativeDriver: true }),
        RNAnimated.timing(btnY, { toValue:  2, duration: 70, useNativeDriver: true }),
        RNAnimated.timing(btnY, { toValue:  0, duration: 60, useNativeDriver: true }),
      ]),
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
    RNAnimated.timing(ringOpacity, { toValue: 0, duration: 180, useNativeDriver: true }).start();
  };

  // Unified action: fire at locked target or free-aim (even with no target in cone)
  const doAction = () => {
    if (hasLockedTarget.current) doLockedAction();
    else doFreeAimAction();
  };

  // ── PanResponder ──────────────────────────────────────────────────────────
  const mainPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,

      onPanResponderGrant: () => {
        pressStart.current = Date.now();
        isHolding.current  = false;
        RNAnimated.spring(btnScale, { toValue: 0.9, useNativeDriver: true, tension: 200, friction: 10 }).start();

        // Long-press always starts, works for both locked and free-aim
        pressTimer.current = setTimeout(() => {
          if (isAimingRef.current) return; // joystick already took over
          isHolding.current = true;
          doAction();
          holdTimer.current = setInterval(doAction, 80);
        }, 480);
      },

      onPanResponderMove: (_, gs) => {
        const mag = Math.hypot(gs.dx, gs.dy);

        // Joystick: drag > 12px, no locked target
        if (mag > 12 && !hasLockedTarget.current) {
          const angle = ((Math.atan2(gs.dx, -gs.dy) * 180) / Math.PI + 360) % 360;
          ringRotate.setValue(angle);

          if (!isAimingRef.current) {
            // First drag: cancel long-press, activate joystick + start firing
            stopTimers();
            showRing(angle);
            doFreeAimAction();
            holdTimer.current = setInterval(doFreeAimAction, 80);
          } else {
            // Already joysticking: just update direction on map
            onAimAngleChangeRef.current?.(angle);
          }

          const target = findTargetInCone(angle);
          aimTargetRef.current = target;
          setHasAimTarget(!!target);
        }
      },

      onPanResponderRelease: () => {
        RNAnimated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
        stopTimers();

        if (isAimingRef.current) {
          hideRing();
        } else {
          // Short tap: fire once (locked or free)
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

      {/* Main layout */}
      <RNAnimated.View
        style={[styles.container, { bottom: RNAnimated.add(insets.bottom + 16, bottomAnim) }]}
      >
        {/* Vertical mode list */}
        <View style={styles.modeList}>
          {MODES.map((mode) => {
            const cfg      = MODE_CONFIG[mode];
            const isActive = activeMode === mode;
            const slot     = getSlotForMode(mode);
            const slotColor = slot
              ? (mode === "use"
                  ? (ITEM_COLORS[(slot as InventoryItem).type] ?? C.purple)
                  : (SPOT_COLORS[(slot as Spot).type] ?? C.accent))
              : C.textMuted;
            const slotIcon = slot
              ? (mode === "use"
                  ? (ITEM_ICONS[(slot as InventoryItem).type] ?? "package")
                  : (SPOT_ICONS[(slot as Spot).type]         ?? "package"))
              : null;

            return (
              <View key={mode} style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.slotBtn, {
                    backgroundColor: slot ? slotColor + "20" : C.surface,
                    borderColor:     slot ? slotColor + "88" : C.border,
                  }]}
                  onPress={() => setPickerMode(mode)}
                  activeOpacity={0.75}
                >
                  {slotIcon
                    ? <Feather name={slotIcon as any} size={14} color={slotColor} />
                    : <Feather name="plus" size={12} color={C.textMuted} />
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeBtn, {
                    backgroundColor: isActive ? C.accent + "20" : "transparent",
                    borderColor:     isActive ? C.accent + "88" : C.border,
                  }]}
                  onPress={() => {
                    setActiveMode(mode);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.75}
                >
                  <Feather name={cfg.icon as any} size={11} color={isActive ? C.accent : C.textMuted} />
                  <Text style={[styles.modeLabel, { color: isActive ? C.accent : C.textMuted }]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Action button */}
        {/*
          Layout trick: the visual button is BTN_SIZE.
          An invisible "touch catcher" View extends TOUCH_PAD in all directions
          via negative margin/absolute — captures the pan gesture without
          changing where the button appears on screen.
        */}
        <View style={styles.btnOuter}>

          {/* Free-aim ring: orbiting pointer on a circle around the button.
              The whole ring View rotates so the pointer (at 12-o'clock) tracks aim direction. */}
          <RNAnimated.View
            style={[
              styles.aimRingWrap,
              { opacity: ringOpacity, transform: [{
                  rotate: ringRotate.interpolate({ inputRange: [0, 360], outputRange: ["0deg", "360deg"] }),
              }] },
            ]}
            pointerEvents="none"
          >
            {/* Ring circle */}
            <View style={[styles.aimRing, { borderColor: ringColor }]} />
            {/* Pointer dot at 12-o'clock (North), rotates with ring */}
            <View style={[styles.aimPointer, { backgroundColor: pointerColor }]} />
          </RNAnimated.View>

          {/* Visual button */}
          <RNAnimated.View
            style={[
              styles.btn,
              {
                backgroundColor: canAct ? btnColor + "22" : C.card,
                borderColor:     canAct ? btnColor        : C.border,
                borderWidth:     canAct ? 2 : 1.5,
                transform: [{ scale: btnScale }, { translateY: btnY }],
              },
              canAct && {
                shadowColor:   btnColor,
                shadowOpacity: 0.55,
                shadowRadius:  14,
                elevation:     10,
              },
            ]}
          >
            <Feather name={btnIcon as any} size={26} color={canAct ? btnColor : C.textMuted} />
            <Text style={[styles.btnLabel, { color: canAct ? btnColor : C.textMuted }]}>
              {MODE_CONFIG[activeMode].label}
            </Text>
            {activeMode === "atk" && canAct && miningClicks > 0 && (
              <View style={[styles.badge, { backgroundColor: C.bg, borderColor: btnColor }]}>
                <Text style={[styles.badgeText, { color: btnColor }]}>{miningClicks}x</Text>
              </View>
            )}
          </RNAnimated.View>

          {/* Invisible touch-catcher — same center as button, extends TOUCH_PAD outwards */}
          <View style={styles.touchCatcher} {...mainPan.panHandlers} />
        </View>
      </RNAnimated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position:       "absolute",
    right:          16,
    flexDirection:  "column",
    alignItems:     "flex-end",
    gap:            8,
    zIndex:         20,
  },
  modeList: {
    gap:        6,
    alignItems: "flex-end",
  },
  modeRow: {
    flexDirection: "row",
    alignItems:    "center",
    gap:           5,
  },
  slotBtn: {
    width:          28,
    height:         28,
    borderRadius:   14,
    borderWidth:    1.5,
    alignItems:     "center",
    justifyContent: "center",
  },
  modeBtn: {
    flexDirection:  "row",
    alignItems:     "center",
    gap:            4,
    paddingHorizontal: 9,
    paddingVertical:   5,
    borderRadius:   12,
    borderWidth:    1.5,
  },
  modeLabel: {
    fontSize:      10,
    fontFamily:    "Inter_700Bold",
    letterSpacing: 0.8,
  },

  // Outer wrapper: just enough to contain the absolute-positioned ring + touch-catcher
  btnOuter: {
    width:          BTN_SIZE,
    height:         BTN_SIZE,
    alignItems:     "center",
    justifyContent: "center",
  },

  // Ring sits absolutely centered on the button, larger than it
  aimRingWrap: {
    position:   "absolute",
    width:      RING_SIZE,
    height:     RING_SIZE,
    alignItems: "center",
    // Center over the button
    left:   -(RING_SIZE - BTN_SIZE) / 2,
    top:    -(RING_SIZE - BTN_SIZE) / 2,
  },
  aimRing: {
    position:     "absolute",
    width:        RING_SIZE,
    height:       RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth:  1.5,
    borderStyle:  "dashed",
  },
  // Pointer at 12-o'clock within aimRingWrap
  aimPointer: {
    position:     "absolute",
    top:          2,
    left:         RING_SIZE / 2 - 5,
    width:        10,
    height:       10,
    borderRadius: 5,
  },

  btn: {
    width:          BTN_SIZE,
    height:         BTN_SIZE,
    borderRadius:   BTN_SIZE / 2,
    alignItems:     "center",
    justifyContent: "center",
    shadowColor:    "#000",
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.5,
    shadowRadius:   8,
    elevation:      6,
    gap:            3,
  },
  btnLabel: {
    fontSize:      9,
    fontFamily:    "Inter_700Bold",
    letterSpacing: 0.8,
  },
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

  // Touch-catcher is bigger than the button by TOUCH_PAD on all sides
  touchCatcher: {
    position:     "absolute",
    left:         -TOUCH_PAD,
    top:          -TOUCH_PAD,
    right:        -TOUCH_PAD,
    bottom:       -TOUCH_PAD,
    borderRadius: (BTN_SIZE + TOUCH_PAD * 2) / 2,
  },

  // Modal
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
    fontSize:       13,
    fontFamily:     "Inter_400Regular",
    textAlign:      "center",
    paddingVertical: 24,
  },
});
