import React, { useEffect } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Marker } from "react-native-maps";

import COLORS from "@/constants/colors";
import { NearbyUser } from "@/context/GameContext";

interface UserMarkerContentProps {
  user: NearbyUser;
  isSelected: boolean;
}

function UserMarkerContent({ user, isSelected }: UserMarkerContentProps) {
  const isCollecting = !!user.collectingSpotId;
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isCollecting) {
      scale.value = withRepeat(
        withTiming(1.1, { duration: 600 }),
        -1,
        true
      );
    } else {
      scale.value = 1;
    }
  }, [isCollecting]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const healthPercent = user.health / user.maxHealth;
  const healthColor =
    healthPercent > 0.6
      ? COLORS.dark.accent
      : healthPercent > 0.3
      ? COLORS.dark.warning
      : COLORS.dark.danger;

  return (
    <View style={styles.wrapper}>
      {isCollecting && (
        <View style={styles.progressRing}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${user.collectProgress}%`,
                backgroundColor: COLORS.dark.accent,
              },
            ]}
          />
        </View>
      )}
      <Animated.View
        style={[
          styles.avatar,
          {
            borderColor: isSelected
              ? COLORS.dark.accent
              : isCollecting
              ? COLORS.dark.warning
              : COLORS.dark.border,
            shadowColor: isSelected ? COLORS.dark.accent : "transparent",
          },
          animStyle,
        ]}
      >
        <Text style={styles.avatarText}>{user.avatar}</Text>
      </Animated.View>
      <View style={styles.healthBar}>
        <View
          style={[
            styles.healthFill,
            {
              width: `${healthPercent * 100}%`,
              backgroundColor: healthColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

interface UserMarkerProps {
  user: NearbyUser;
  isSelected: boolean;
  onPress: () => void;
}

export function UserMarker({ user, isSelected, onPress }: UserMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude: user.latitude, longitude: user.longitude }}
      onPress={onPress}
      tracksViewChanges
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <UserMarkerContent user={user} isSelected={isSelected} />
    </Marker>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  progressRing: {
    width: 52,
    height: 6,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 3,
    marginBottom: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    backgroundColor: COLORS.dark.bgSecondary,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: {
    color: COLORS.dark.text,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  healthBar: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 2,
    marginTop: 3,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    borderRadius: 2,
  },
});
