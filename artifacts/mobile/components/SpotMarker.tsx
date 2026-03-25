import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Marker } from "react-native-maps";

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

interface SpotMarkerContentProps {
  spot: Spot;
  isSelected: boolean;
}

function SpotMarkerContent({ spot, isSelected }: SpotMarkerContentProps) {
  const color = SPOT_COLORS[spot.type] ?? COLORS.dark.accent;
  const iconName = SPOT_ICONS[spot.type] ?? "map-pin";

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 900 }),
        withTiming(0.3, { duration: 900 })
      ),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.markerWrapper}>
      <Animated.View
        style={[
          styles.pulse,
          { backgroundColor: color },
          pulseStyle,
        ]}
      />
      <View
        style={[
          styles.markerOuter,
          {
            borderColor: color,
            backgroundColor: isSelected
              ? color + "33"
              : COLORS.dark.bgSecondary,
            shadowColor: color,
          },
        ]}
      >
        <Feather name={iconName as any} size={16} color={color} />
      </View>
      {spot.isCollecting && (
        <View style={[styles.collectingDot, { backgroundColor: COLORS.dark.accent }]} />
      )}
    </View>
  );
}

interface SpotMarkerProps {
  spot: Spot;
  isSelected: boolean;
  onPress: () => void;
}

export function SpotMarker({ spot, isSelected, onPress }: SpotMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      onPress={onPress}
      tracksViewChanges={Platform.OS !== "web"}
    >
      <SpotMarkerContent spot={spot} isSelected={isSelected} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
  },
  pulse: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  markerOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
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
