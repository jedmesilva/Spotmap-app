import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const SIZE = 180;

function hexAlpha(hex: string, alpha: number): string {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
}

function VignetteGradients({ color, intensity }: { color: string; intensity: number }) {
  const opaque = hexAlpha(color, intensity);
  const clear = hexAlpha(color, 0);
  return (
    <>
      <LinearGradient colors={[opaque, clear]} style={[styles.strip, styles.top]} />
      <LinearGradient colors={[clear, opaque]} style={[styles.strip, styles.bottom]} />
      <LinearGradient
        colors={[opaque, clear]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.strip, styles.left]}
      />
      <LinearGradient
        colors={[clear, opaque]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.strip, styles.right]}
      />
    </>
  );
}

interface VignetteProps {
  isFocused: boolean;
  health: number;
  maxHealth: number;
}

export function Vignette({ isFocused, health, maxHealth }: VignetteProps) {
  const focusOpacity = useSharedValue(0);
  const lowHealthOpacity = useSharedValue(0);
  const attackedOpacity = useSharedValue(0);

  const prevHealthRef = useRef(health);

  useEffect(() => {
    focusOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 450, easing: Easing.out(Easing.ease) });
  }, [isFocused]);

  const healthRatio = maxHealth > 0 ? health / maxHealth : 1;
  const isLowHealth = healthRatio < 0.3;

  useEffect(() => {
    cancelAnimation(lowHealthOpacity);
    if (isLowHealth) {
      lowHealthOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.25, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      lowHealthOpacity.value = withTiming(0, { duration: 600 });
    }
  }, [isLowHealth]);

  useEffect(() => {
    if (health < prevHealthRef.current) {
      cancelAnimation(attackedOpacity);
      attackedOpacity.value = withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(0.5, { duration: 180 }),
        withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) })
      );
    }
    prevHealthRef.current = health;
  }, [health]);

  const focusStyle = useAnimatedStyle(() => ({ opacity: focusOpacity.value }));
  const lowHealthStyle = useAnimatedStyle(() => ({ opacity: lowHealthOpacity.value }));
  const attackedStyle = useAnimatedStyle(() => ({ opacity: attackedOpacity.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, focusStyle]}>
        <VignetteGradients color="#000000" intensity={0.72} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, lowHealthStyle]}>
        <VignetteGradients color="#CC0000" intensity={0.65} />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, attackedStyle]}>
        <VignetteGradients color="#FF0000" intensity={0.88} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: "absolute",
  },
  top: {
    top: 0,
    left: 0,
    right: 0,
    height: SIZE,
  },
  bottom: {
    bottom: 0,
    left: 0,
    right: 0,
    height: SIZE,
  },
  left: {
    top: 0,
    bottom: 0,
    left: 0,
    width: SIZE * 0.65,
  },
  right: {
    top: 0,
    bottom: 0,
    right: 0,
    width: SIZE * 0.65,
  },
});
