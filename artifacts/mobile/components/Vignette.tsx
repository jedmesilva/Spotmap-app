import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

const STRIP_SIZE = 180;

function hexAlpha(hex: string, alpha: number): string {
  return hex + Math.round(alpha * 255).toString(16).padStart(2, "0");
}

/** Circular radial vignette — transparent centre, dark edges */
function CircularVignette({ color, intensity }: { color: string; intensity: number }) {
  const { width, height } = useWindowDimensions();
  const cx = width / 2;
  const cy = height / 2;
  // radius just big enough so the circle touches the shorter side
  const r = (Math.min(width, height) / 2) * 1.05;

  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient
          id="focusVignette"
          cx={cx}
          cy={cy}
          r={r}
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset="0"   stopColor={color} stopOpacity={0} />
          <Stop offset="0.55" stopColor={color} stopOpacity={0} />
          <Stop offset="1"   stopColor={color} stopOpacity={intensity} />
        </RadialGradient>
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill="url(#focusVignette)" />
    </Svg>
  );
}

/** Strip vignette (top + bottom) — used for health effects */
function StripVignette({ color, intensity }: { color: string; intensity: number }) {
  const opaque = hexAlpha(color, intensity);
  const clear  = hexAlpha(color, 0);
  return (
    <>
      <LinearGradient colors={[opaque, clear]} style={[styles.strip, styles.top]} />
      <LinearGradient colors={[clear, opaque]} style={[styles.strip, styles.bottom]} />
    </>
  );
}

interface VignetteProps {
  isFocused: boolean;
  health: number;
  maxHealth: number;
}

export function Vignette({ isFocused, health, maxHealth }: VignetteProps) {
  const focusOpacity    = useSharedValue(0);
  const lowHealthOpacity = useSharedValue(0);
  const attackedOpacity  = useSharedValue(0);

  const prevHealthRef = useRef(health);

  useEffect(() => {
    focusOpacity.value = withTiming(isFocused ? 1 : 0, {
      duration: 450,
      easing: Easing.out(Easing.ease),
    });
  }, [isFocused]);

  const healthRatio = maxHealth > 0 ? health / maxHealth : 1;
  const isLowHealth  = healthRatio < 0.3;

  useEffect(() => {
    cancelAnimation(lowHealthOpacity);
    if (isLowHealth) {
      lowHealthOpacity.value = withRepeat(
        withSequence(
          withTiming(1,    { duration: 700, easing: Easing.inOut(Easing.ease) }),
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
        withTiming(1,   { duration: 60 }),
        withTiming(0.5, { duration: 180 }),
        withTiming(0,   { duration: 500, easing: Easing.out(Easing.ease) })
      );
    }
    prevHealthRef.current = health;
  }, [health]);

  const focusStyle     = useAnimatedStyle(() => ({ opacity: focusOpacity.value }));
  const lowHealthStyle = useAnimatedStyle(() => ({ opacity: lowHealthOpacity.value }));
  const attackedStyle  = useAnimatedStyle(() => ({ opacity: attackedOpacity.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Focus overlay — circular radial gradient */}
      <Animated.View style={[StyleSheet.absoluteFill, focusStyle]}>
        <CircularVignette color="#000000" intensity={0.80} />
      </Animated.View>

      {/* Low health — top+bottom strips */}
      <Animated.View style={[StyleSheet.absoluteFill, lowHealthStyle]}>
        <StripVignette color="#CC0000" intensity={0.65} />
      </Animated.View>

      {/* Attacked flash — top+bottom strips */}
      <Animated.View style={[StyleSheet.absoluteFill, attackedStyle]}>
        <StripVignette color="#FF0000" intensity={0.88} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    position: "absolute",
  },
  top: {
    top:    0,
    left:   0,
    right:  0,
    height: STRIP_SIZE,
  },
  bottom: {
    bottom: 0,
    left:   0,
    right:  0,
    height: STRIP_SIZE,
  },
});
