import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import COLORS from "@/constants/colors";
import { Spot } from "@/context/GameContext";

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

interface SpotMarkerProps {
  spot: Spot;
  isSelected: boolean;
  position: { x: number; y: number };
  onPress: () => void;
}

export function SpotMarker({ spot, isSelected, position, onPress }: SpotMarkerProps) {
  const color = SPOT_COLORS[spot.type] ?? COLORS.dark.accent;
  const iconName = SPOT_ICONS[spot.type] ?? "map-pin";
  const SIZE = 44;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          left: position.x - SIZE / 2,
          top: position.y - SIZE / 2,
          width: SIZE,
          height: SIZE,
        },
      ]}
    >
      <View
        style={[
          styles.outerRing,
          {
            borderColor: isSelected ? color : color + "70",
            backgroundColor: isSelected ? color + "28" : color + "14",
          },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              backgroundColor: isSelected ? color + "30" : COLORS.dark.bgSecondary,
              borderColor: color,
              shadowColor: color,
            },
          ]}
        >
          <Feather name={iconName as any} size={15} color={color} />
        </View>
      </View>

      {spot.isCollecting && (
        <View style={[styles.collectingDot, { backgroundColor: COLORS.dark.accent }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  outerRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  collectingDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.dark.bg,
  },
});
