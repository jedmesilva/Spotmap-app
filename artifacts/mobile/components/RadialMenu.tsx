import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated as RNAnimated, Image, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export interface RadialSlot {
  id: string;
  label: string;
  color: string;
  icon: string;
  previewName: string;
  previewType: string;
  previewDescription: string;
  previewImpact: string;
  previewTarget: string;
  previewImageUrl?: string;
  quantity?: number;
}

interface RadialMenuProps {
  visible: boolean;
  slots: RadialSlot[];
  slotPositions: { x: number; y: number }[];
  hoveredIndex: number | null;
  previewOnLeft: boolean;
  topInset: number;
}

const SLOT_SIZE = 58;
const MAX_SLOTS = 8;

export function RadialMenu({
  visible,
  slots,
  slotPositions,
  hoveredIndex,
  previewOnLeft,
  topInset,
}: RadialMenuProps) {
  const C = useColors();

  const backdropOpacity = useRef(new RNAnimated.Value(0)).current;

  const slotScales = useRef(
    Array.from({ length: MAX_SLOTS }, () => new RNAnimated.Value(0))
  ).current;
  const slotOpacities = useRef(
    Array.from({ length: MAX_SLOTS }, () => new RNAnimated.Value(0))
  ).current;
  const hoverScales = useRef(
    Array.from({ length: MAX_SLOTS }, () => new RNAnimated.Value(1))
  ).current;
  const combinedScales = useRef(
    Array.from({ length: MAX_SLOTS }, (_, i) =>
      RNAnimated.multiply(slotScales[i], hoverScales[i])
    )
  ).current;

  const previewOpacity = useRef(new RNAnimated.Value(0)).current;
  const previewTranslateY = useRef(new RNAnimated.Value(-8)).current;

  useEffect(() => {
    if (visible) {
      RNAnimated.timing(backdropOpacity, {
        toValue: 0.55,
        duration: 160,
        useNativeDriver: true,
      }).start();

      RNAnimated.stagger(
        45,
        slotScales.slice(0, slots.length).map((scale, i) =>
          RNAnimated.parallel([
            RNAnimated.spring(scale, {
              toValue: 1,
              tension: 130,
              friction: 7,
              useNativeDriver: true,
            }),
            RNAnimated.timing(slotOpacities[i], {
              toValue: 1,
              duration: 130,
              useNativeDriver: true,
            }),
          ])
        )
      ).start();
    } else {
      RNAnimated.timing(backdropOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }).start();

      slotScales.slice(0, slots.length).forEach((scale, i) => {
        RNAnimated.timing(scale, { toValue: 0, duration: 100, useNativeDriver: true }).start();
        RNAnimated.timing(slotOpacities[i], { toValue: 0, duration: 100, useNativeDriver: true }).start();
      });

      RNAnimated.timing(previewOpacity, { toValue: 0, duration: 100, useNativeDriver: true }).start();
      previewTranslateY.setValue(-8);
    }
  }, [visible]);

  useEffect(() => {
    hoverScales.forEach((hs, i) => {
      RNAnimated.spring(hs, {
        toValue: i === hoveredIndex ? 1.15 : 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }).start();
    });

    if (hoveredIndex !== null) {
      RNAnimated.parallel([
        RNAnimated.timing(previewOpacity, { toValue: 1, duration: 140, useNativeDriver: true }),
        RNAnimated.spring(previewTranslateY, { toValue: 0, tension: 120, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      RNAnimated.timing(previewOpacity, { toValue: 0, duration: 100, useNativeDriver: true }).start();
      previewTranslateY.setValue(-8);
    }
  }, [hoveredIndex]);

  const hoveredSlot = hoveredIndex !== null ? slots[hoveredIndex] : null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <RNAnimated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: backdropOpacity }]}
      />

      {hoveredSlot && (
        <RNAnimated.View
          style={[
            styles.preview,
            previewOnLeft ? { left: 16 } : { right: 16 },
            {
              top: topInset + 8,
              opacity: previewOpacity,
              transform: [{ translateY: previewTranslateY }],
              backgroundColor: C.card,
              borderColor: hoveredSlot.color + "88",
            },
          ]}
        >
          <View
            style={[
              styles.previewIconWrap,
              { backgroundColor: hoveredSlot.color + "22", borderColor: hoveredSlot.color + "44" },
            ]}
          >
            {hoveredSlot.previewImageUrl ? (
              <Image
                source={{ uri: hoveredSlot.previewImageUrl }}
                style={styles.previewImage}
              />
            ) : (
              <Feather name={hoveredSlot.icon as any} size={24} color={hoveredSlot.color} />
            )}
          </View>

          <View style={styles.previewBody}>
            <Text style={[styles.previewName, { color: C.text }]} numberOfLines={1}>
              {hoveredSlot.previewName}
            </Text>
            <Text style={[styles.previewType, { color: hoveredSlot.color }]}>
              {hoveredSlot.previewType}
            </Text>
            <Text style={[styles.previewDesc, { color: C.textSecondary }]} numberOfLines={2}>
              {hoveredSlot.previewDescription}
            </Text>
            <View style={styles.previewStats}>
              <View
                style={[
                  styles.statChip,
                  { backgroundColor: hoveredSlot.color + "22", borderColor: hoveredSlot.color + "55" },
                ]}
              >
                <Text style={[styles.statText, { color: hoveredSlot.color }]}>
                  {hoveredSlot.previewImpact}
                </Text>
              </View>
              <View style={[styles.statChip, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.statText, { color: C.textSecondary }]}>
                  {hoveredSlot.previewTarget}
                </Text>
              </View>
            </View>
          </View>
        </RNAnimated.View>
      )}

      {slots.length === 0 && (
        <View style={styles.emptyHint}>
          <Feather name="package" size={22} color="#fff" style={{ opacity: 0.5 }} />
          <Text style={styles.emptyHintText}>Nenhum item disponível</Text>
          <Text style={styles.emptyHintSub}>Colete spots no mapa para equipar</Text>
        </View>
      )}

      {slots.map((slot, i) => {
        const pos = slotPositions[i];
        if (!pos) return null;
        const isHovered = hoveredIndex === i;
        const opacity = slotOpacities[i];

        return (
          <RNAnimated.View
            key={slot.id}
            style={[
              styles.slot,
              {
                left: pos.x - SLOT_SIZE / 2,
                top: pos.y - SLOT_SIZE / 2,
                width: SLOT_SIZE,
                height: SLOT_SIZE,
                backgroundColor: isHovered ? slot.color + "30" : C.surface,
                borderColor: isHovered ? slot.color : slot.color + "77",
                borderWidth: isHovered ? 2.5 : 1.5,
                shadowColor: slot.color,
                shadowOpacity: isHovered ? 0.7 : 0.2,
                shadowRadius: isHovered ? 14 : 5,
                elevation: isHovered ? 12 : 4,
                transform: [{ scale: combinedScales[i] }],
                opacity,
              },
            ]}
          >
            <Feather
              name={slot.icon as any}
              size={20}
              color={isHovered ? slot.color : slot.color + "BB"}
            />
            <Text
              style={[styles.slotLabel, { color: isHovered ? slot.color : C.textMuted }]}
              numberOfLines={1}
            >
              {slot.label}
            </Text>
            {slot.quantity !== undefined && slot.quantity > 1 && (
              <View style={[styles.qtyBadge, { backgroundColor: slot.color }]}>
                <Text style={styles.qtyText}>{slot.quantity}</Text>
              </View>
            )}
          </RNAnimated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 4,
    padding: 12,
    maxWidth: 230,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  previewIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 4,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  previewImage: {
    width: 52,
    height: 52,
    borderRadius: 4,
  },
  previewBody: {
    flex: 1,
    gap: 3,
  },
  previewName: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  previewType: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  previewDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 15,
    marginTop: 1,
  },
  previewStats: {
    flexDirection: "row",
    gap: 5,
    marginTop: 4,
    flexWrap: "wrap",
  },
  statChip: {
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  slot: {
    position: "absolute",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  slotLabel: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    maxWidth: SLOT_SIZE - 8,
    textAlign: "center",
  },
  qtyBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  qtyText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  emptyHint: {
    position: "absolute",
    top: "40%",
    alignSelf: "center",
    alignItems: "center",
    gap: 8,
  },
  emptyHintText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    opacity: 0.8,
  },
  emptyHintSub: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    opacity: 0.5,
    textAlign: "center",
  },
});
