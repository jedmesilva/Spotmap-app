import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
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
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.6, { duration: 1000, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1000, easing: Easing.out(Easing.ease) }),
        withTiming(0.6, { duration: 0 })
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
    <View style={styles.wrapper}>
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
            backgroundColor: isSelected ? color + "40" : COLORS.dark.bgSecondary,
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
      tracksViewChanges
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <SpotMarkerContent spot={spot} isSelected={isSelected} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  pulse: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  markerOuter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
  collectingDot: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.dark.bg,
  },
});
