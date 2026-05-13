import { Feather } from "@expo/vector-icons";
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

import {
  SPOT_DAMAGE,
  SubstanceType,
  SpotType,
  Spot,
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
  coupon: "#C97400",
  money:  "#5D8A20",
  product:"#1A6B9A",
  rare:   "#7A5CB0",
};
const SPOT_ICONS: Record<string, string> = {
  coupon: "tag",
  money:  "dollar-sign",
  product:"box",
  rare:   "star",
};
const SPOT_LABELS: Record<string, string> = {
  coupon: "CUPOM",
  money:  "DINHEIRO",
  product:"PRODUTO",
  rare:   "RARO",
};

const SUBSTANCE_TYPES: SubstanceType[] = [
  "flame_shield","cryo_armor","volt_ward","antidote","barrier",
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
    fireInventorySpot,
  } = useGame();

  const [activeMode, setActiveMode] = useState<ActionMode>("atk");
  const [pickerMode, setPickerMode] = useState<ActionMode | null>(null);

  // Selected item per mode
  const [atkItem, setAtkItem]   = useState<Spot | null>(null);
  const [farmItem, setFarmItem] = useState<Spot | null>(null);
  const [useItem, setUseItem]   = useState<InventoryItem | null>(null);

  // Keep selectedInventorySpot in sync with atkItem
  useEffect(() => {
    if (activeMode === "atk") {
      selectInventorySpot(atkItem ?? null);
    }
  }, [atkItem, activeMode]);

  useEffect(() => {
    if (activeMode === "farm") {
      selectInventorySpot(farmItem ?? null);
    }
  }, [farmItem, activeMode]);

  useEffect(() => {
    if (activeMode === "use") {
      selectInventorySpot(null);
    }
  }, [activeMode]);

  // When mode changes, sync inventory spot
  useEffect(() => {
    if (activeMode === "atk")  selectInventorySpot(atkItem ?? null);
    if (activeMode === "farm") selectInventorySpot(farmItem ?? null);
    if (activeMode === "use")  selectInventorySpot(null);
  }, [activeMode]);

  // Main button animation
  const btnScale = useRef(new RNAnimated.Value(1)).current;
  const btnY     = useRef(new RNAnimated.Value(0)).current;
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHolding = useRef(false);

  const bottomAnim = useRef(new RNAnimated.Value(extraBottomOffset)).current;
  useEffect(() => {
    RNAnimated.spring(bottomAnim, {
      toValue: extraBottomOffset,
      useNativeDriver: false,
      tension: 70,
      friction: 11,
    }).start();
  }, [extraBottomOffset]);

  const animateFire = () => {
    RNAnimated.parallel([
      RNAnimated.sequence([
        RNAnimated.timing(btnScale, { toValue: 0.78, duration: 70, useNativeDriver: true }),
        RNAnimated.timing(btnScale, { toValue: 1.08, duration: 70, useNativeDriver: true }),
        RNAnimated.timing(btnScale, { toValue: 1,    duration: 60, useNativeDriver: true }),
      ]),
      RNAnimated.sequence([
        RNAnimated.timing(btnY, { toValue: -8, duration: 70, useNativeDriver: true }),
        RNAnimated.timing(btnY, { toValue: 2,  duration: 70, useNativeDriver: true }),
        RNAnimated.timing(btnY, { toValue: 0,  duration: 60, useNativeDriver: true }),
      ]),
    ]).start();
  };

  const doAction = () => {
    animateFire();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (activeMode === "atk" && atkItem) {
      onAttack?.();
    } else if (activeMode === "farm" && farmItem) {
      onAttack?.();
    } else if (activeMode === "use" && useItem) {
      if (SUBSTANCE_TYPES.includes(useItem.type as SubstanceType)) {
        useSubstance(useItem.type as SubstanceType);
      }
    }
  };

  const handlePressIn = () => {
    btnScale.setValue(0.92);
    isHolding.current = false;
    pressTimer.current = setTimeout(() => {
      isHolding.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      doAction();
      holdTimer.current = setInterval(() => {
        doAction();
      }, 600);
    }, 480);
  };

  const handlePressOut = () => {
    RNAnimated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 10 }).start();
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
    if (holdTimer.current)  { clearInterval(holdTimer.current);  holdTimer.current  = null; }
    if (!isHolding.current) {
      doAction();
    }
    isHolding.current = false;
  };

  // Derived state for action button appearance
  const canAct = (() => {
    if (activeMode === "atk")  return !!atkItem && (!!selectedUser || canAttack);
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
    if (activeMode === "atk")  return atkItem  ? (SPOT_ICONS[atkItem.type]  ?? "zap") : "zap";
    if (activeMode === "farm") return farmItem ? (SPOT_ICONS[farmItem.type] ?? "cpu") : "cpu";
    if (activeMode === "use")  return useItem  ? (ITEM_ICONS[useItem.type]  ?? "plus-circle") : "plus-circle";
    return "zap";
  })();

  // Items for picker
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
                      const color = ITEM_COLORS[item.type] ?? C.purple;
                      const selected = useItem?.type === item.type;
                      return (
                        <Pressable
                          key={item.type}
                          style={[
                            styles.pickerRow,
                            { borderColor: selected ? color : C.border, backgroundColor: selected ? color + "18" : C.surface },
                          ]}
                          onPress={() => {
                            setUseItem(item);
                            setPickerMode(null);
                            setActiveMode("use");
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                        >
                          <View style={[styles.pickerIcon, { backgroundColor: color + "22" }]}>
                            <Feather name={ITEM_ICONS[item.type] as any ?? "package"} size={18} color={color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.pickerRowName, { color: C.text }]}>{item.name}</Text>
                            <Text style={[styles.pickerRowSub, { color }]}>{ITEM_LABELS[item.type] ?? item.type}</Text>
                          </View>
                          {item.quantity > 1 && (
                            <Text style={[styles.pickerQty, { color: C.textMuted }]}>×{item.quantity}</Text>
                          )}
                          {selected && <Feather name="check" size={14} color={color} />}
                        </Pressable>
                      );
                    })
                : (pickerMode === "atk" ? atkItems : farmItems).length === 0
                  ? <Text style={[styles.emptyText, { color: C.textMuted }]}>Nenhum spot coletado</Text>
                  : (pickerMode === "atk" ? atkItems : farmItems).map((spot) => {
                      const color = SPOT_COLORS[spot.type] ?? C.accent;
                      const currentItem = pickerMode === "atk" ? atkItem : farmItem;
                      const selected = currentItem?.id === spot.id;
                      return (
                        <Pressable
                          key={spot.id}
                          style={[
                            styles.pickerRow,
                            { borderColor: selected ? color : C.border, backgroundColor: selected ? color + "18" : C.surface },
                          ]}
                          onPress={() => {
                            if (pickerMode === "atk")  setAtkItem(spot);
                            if (pickerMode === "farm") setFarmItem(spot);
                            setPickerMode(null);
                            setActiveMode(pickerMode!);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }}
                        >
                          <View style={[styles.pickerIcon, { backgroundColor: color + "22" }]}>
                            <Feather name={SPOT_ICONS[spot.type] as any ?? "package"} size={18} color={color} />
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

      {/* Main container: mode list + action button */}
      <RNAnimated.View
        style={[styles.container, { bottom: RNAnimated.add(insets.bottom + 16, bottomAnim) }]}
      >
        {/* Vertical mode list */}
        <View style={styles.modeList}>
          {MODES.map((mode) => {
            const cfg = MODE_CONFIG[mode];
            const isActive = activeMode === mode;
            const slot = getSlotForMode(mode);
            const slotColor = (() => {
              if (!slot) return C.textMuted;
              if (mode === "use") return ITEM_COLORS[(slot as InventoryItem).type] ?? C.purple;
              return SPOT_COLORS[(slot as Spot).type] ?? C.accent;
            })();
            const slotIcon = (() => {
              if (!slot) return null;
              if (mode === "use") return ITEM_ICONS[(slot as InventoryItem).type] ?? "package";
              return SPOT_ICONS[(slot as Spot).type] ?? "package";
            })();

            return (
              <View key={mode} style={styles.modeRow}>
                {/* Slot button — opens picker */}
                <TouchableOpacity
                  style={[
                    styles.slotBtn,
                    {
                      backgroundColor: slot ? slotColor + "20" : C.surface,
                      borderColor: slot ? slotColor + "88" : C.border,
                    },
                  ]}
                  onPress={() => setPickerMode(mode)}
                  activeOpacity={0.75}
                >
                  {slotIcon ? (
                    <Feather name={slotIcon as any} size={14} color={slotColor} />
                  ) : (
                    <Feather name="plus" size={12} color={C.textMuted} />
                  )}
                </TouchableOpacity>

                {/* Mode label — selects mode */}
                <TouchableOpacity
                  style={[
                    styles.modeBtn,
                    {
                      backgroundColor: isActive ? C.accent + "20" : "transparent",
                      borderColor: isActive ? C.accent + "88" : C.border,
                    },
                  ]}
                  onPress={() => {
                    setActiveMode(mode);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.75}
                >
                  <Feather
                    name={cfg.icon as any}
                    size={11}
                    color={isActive ? C.accent : C.textMuted}
                  />
                  <Text style={[styles.modeLabel, { color: isActive ? C.accent : C.textMuted }]}>
                    {cfg.label}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Action button */}
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <RNAnimated.View
            style={[
              styles.btn,
              {
                backgroundColor: canAct ? btnColor + "22" : C.card,
                borderColor: canAct ? btnColor : C.border,
                borderWidth: canAct ? 2 : 1.5,
                transform: [{ scale: btnScale }, { translateY: btnY }],
              },
              canAct && {
                shadowColor: btnColor,
                shadowOpacity: 0.5,
                shadowRadius: 14,
                elevation: 10,
              },
            ]}
          >
            <Feather
              name={btnIcon as any}
              size={26}
              color={canAct ? btnColor : C.textMuted}
            />
            <Text style={[styles.btnLabel, { color: canAct ? btnColor : C.textMuted }]}>
              {MODE_CONFIG[activeMode].label}
            </Text>
            {activeMode === "atk" && canAct && miningClicks > 0 && (
              <View style={[styles.badge, { backgroundColor: C.bg, borderColor: btnColor }]}>
                <Text style={[styles.badgeText, { color: btnColor }]}>{miningClicks}x</Text>
              </View>
            )}
          </RNAnimated.View>
        </Pressable>
      </RNAnimated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
    zIndex: 20,
  },
  modeList: {
    gap: 6,
    alignItems: "flex-end",
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  slotBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  modeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  modeLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  btn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
    gap: 3,
  },
  btnLabel: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  badge: {
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
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
    padding: 16,
  },
  pickerSheet: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    maxHeight: 420,
  },
  pickerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pickerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  pickerList: {
    flexGrow: 0,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  pickerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerRowName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  pickerRowSub: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  pickerQty: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    marginRight: 4,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingVertical: 24,
  },
});
