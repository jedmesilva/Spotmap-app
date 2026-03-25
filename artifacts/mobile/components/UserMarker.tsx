import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import COLORS from "@/constants/colors";
import { NearbyUser } from "@/context/GameContext";

interface UserMarkerProps {
  user: NearbyUser;
  isSelected: boolean;
  position: { x: number; y: number };
  onPress: () => void;
}

export function UserMarker({ user, isSelected, position, onPress }: UserMarkerProps) {
  const isCollecting = !!user.collectingSpotId;
  const healthPercent = user.health / user.maxHealth;
  const healthColor =
    healthPercent > 0.6
      ? COLORS.dark.accent
      : healthPercent > 0.3
      ? COLORS.dark.warning
      : COLORS.dark.danger;

  const borderColor = isSelected
    ? COLORS.dark.accent
    : isCollecting
    ? COLORS.dark.warning
    : COLORS.dark.border;

  const AVATAR = 40;
  const TOTAL_WIDTH = 56;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          left: position.x - TOTAL_WIDTH / 2,
          top: position.y - AVATAR / 2 - (isCollecting ? 14 : 0),
        },
      ]}
    >
      {isCollecting && (
        <View style={styles.progressRing}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${user.collectProgress}%` as any,
                backgroundColor:
                  user.collectProgress > 60
                    ? COLORS.dark.danger
                    : COLORS.dark.warning,
              },
            ]}
          />
        </View>
      )}

      <View style={[styles.avatar, { borderColor }]}>
        <Text style={styles.avatarText}>{user.avatar}</Text>
      </View>

      <View style={styles.healthBar}>
        <View
          style={[
            styles.healthFill,
            {
              width: `${healthPercent * 100}%` as any,
              backgroundColor: healthColor,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignItems: "center",
    width: 56,
  },
  progressRing: {
    width: 52,
    height: 5,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 3,
    marginBottom: 3,
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
