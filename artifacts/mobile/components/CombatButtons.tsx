import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated as RNAnimated, Pressable, StyleSheet, Text, View } from "react-native";

import { useGame } from "@/context/GameContext";
import { useColors } from "@/hooks/useColors";

interface CombatButtonsProps {
  insets: { bottom: number };
  onAttack?: () => void;
  onDefend?: () => void;
  canAttack?: boolean;
  extraBottomOffset?: number;
}

export function CombatButtons({
  insets,
  onAttack,
  onDefend,
  canAttack = false,
  extraBottomOffset = 0,
}: CombatButtonsProps) {
  const C = useColors();
  const { selectedUser } = useGame();

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

  const handleAttack = () => {
    if (!canAttack) return;
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onAttack?.();
  };

  const handleDefend = () => {
    RNAnimated.sequence([
      RNAnimated.timing(defScale, { toValue: 0.75, duration: 80, useNativeDriver: true }),
      RNAnimated.timing(defScale, { toValue: 1.1, duration: 80, useNativeDriver: true }),
      RNAnimated.timing(defScale, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onDefend?.();
  };

  const atkColor = selectedUser ? C.danger : C.accent;
  const defColor = C.purple;

  return (
    <RNAnimated.View
      style={[styles.container, { bottom: RNAnimated.add(insets.bottom + 16, bottomAnim) }]}
    >
      <Pressable
        onPress={handleDefend}
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
      >
        <RNAnimated.View
          style={[
            styles.btn,
            {
              backgroundColor: defColor + "18",
              borderColor: defColor + "66",
              borderWidth: 1.5,
              transform: [{ scale: defScale }],
            },
          ]}
        >
          <Feather name="shield" size={22} color={defColor} />
          <Text style={[styles.label, { color: defColor }]}>DEF</Text>
        </RNAnimated.View>
      </Pressable>

      <Pressable
        onPress={handleAttack}
        style={({ pressed }) => ({ opacity: pressed ? 0.75 : canAttack ? 1 : 0.45 })}
      >
        <RNAnimated.View
          style={[
            styles.btn,
            styles.atkBtn,
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
          <Feather
            name="zap"
            size={26}
            color={canAttack ? atkColor : C.textMuted}
          />
          <Text style={[styles.label, { color: canAttack ? atkColor : C.textMuted, fontSize: 9 }]}>
            ATK
          </Text>
        </RNAnimated.View>
      </Pressable>
    </RNAnimated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    gap: 8,
    zIndex: 20,
    alignItems: "center",
  },
  btn: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    gap: 3,
  },
  atkBtn: {},
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
});
