import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Callout, Marker } from "react-native-maps";

import COLORS from "@/constants/colors";
import { NearbyUser } from "@/context/GameContext";

interface UserMarkerProps {
  user: NearbyUser;
  isSelected: boolean;
  onPress: () => void;
}

function getHealthColor(health: number, maxHealth: number): string {
  const ratio = maxHealth > 0 ? health / maxHealth : 1;
  if (ratio > 0.6) return COLORS.dark.spotMoney;
  if (ratio > 0.3) return COLORS.dark.warning;
  return COLORS.dark.danger;
}

export function UserMarker({ user, isSelected, onPress }: UserMarkerProps) {
  const isCollecting = !!user.collectingSpotId;
  const healthColor = getHealthColor(user.health, user.maxHealth);

  const borderColor = isSelected
    ? COLORS.dark.accent
    : isCollecting
    ? COLORS.dark.warning
    : healthColor;

  return (
    <Marker
      key={`${user.id}-${isCollecting}-${Math.round(user.collectProgress / 10)}`}
      coordinate={{ latitude: user.latitude, longitude: user.longitude }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
    >
      <View style={styles.padding}>
        <View style={[styles.avatar, { borderColor }]}>
          <Text style={styles.avatarText}>{user.avatar}</Text>
        </View>

        <View style={styles.healthBar}>
          <View
            style={[
              styles.healthFill,
              {
                width: `${Math.max(0, Math.min(100, (user.health / user.maxHealth) * 100))}%` as any,
                backgroundColor: healthColor,
              },
            ]}
          />
        </View>

        {isCollecting && (
          <View style={styles.collectBar}>
            <View
              style={[
                styles.collectFill,
                {
                  width: `${user.collectProgress}%` as any,
                  backgroundColor: COLORS.dark.info,
                },
              ]}
            />
          </View>
        )}
      </View>
      <Callout tooltip>
        <View />
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  padding: {
    padding: 10,
    alignItems: "center",
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
    height: 3,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    borderRadius: 2,
  },
  collectBar: {
    width: 40,
    height: 3,
    backgroundColor: COLORS.dark.surface,
    borderRadius: 2,
    marginTop: 2,
    overflow: "hidden",
  },
  collectFill: {
    height: "100%",
    borderRadius: 2,
  },
});
