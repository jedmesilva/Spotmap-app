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

export function UserMarker({ user, isSelected, onPress }: UserMarkerProps) {
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

  return (
    <Marker
      coordinate={{ latitude: user.latitude, longitude: user.longitude }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
    >
      {/*
        Padding buffer: prevents Android bitmap snapshot from clipping views.
        No shadow/elevation inside — those cause clipping on Android.
      */}
      <View style={styles.padding}>
        {isCollecting && (
          <View style={styles.progressBar}>
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
      </View>
      {/* Suppress the default Google Maps navigation callout */}
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
    /* NO shadow/elevation */
  },
  progressBar: {
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
    /* NO elevation */
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
