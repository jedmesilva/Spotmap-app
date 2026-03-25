import React, { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";
import { GameMap, GameMapHandle } from "@/components/GameMap";
import { SpotPanel } from "@/components/SpotPanel";
import { AttackPanel } from "@/components/AttackPanel";
import { BagSidebar } from "@/components/BagSidebar";
import { UserProfileHUD } from "@/components/UserProfileHUD";
import COLORS from "@/constants/colors";

const USER_RADIUS = 60;

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const mapRef = useRef<GameMapHandle>(null);
  const {
    spots,
    nearbyUsers,
    selectedSpot,
    selectedUser,
    selectSpot,
    selectUser,
    userLocation,
    setUserLocation,
  } = useGame();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    })();
  }, []);

  const handleSpotPress = useCallback(
    (spotId: string) => {
      const spot = spots.find((s) => s.id === spotId);
      selectSpot(spot ?? null);
      selectUser(null);
    },
    [spots, selectSpot, selectUser]
  );

  const handleUserPress = useCallback(
    (userId: string) => {
      const user = nearbyUsers.find((u) => u.id === userId);
      selectUser(user ?? null);
      selectSpot(null);
    },
    [nearbyUsers, selectUser, selectSpot]
  );

  const handleMapPress = useCallback(() => {
    selectSpot(null);
    selectUser(null);
  }, [selectSpot, selectUser]);

  const isSpotInRange = (spot: { latitude: number; longitude: number; radius: number }) => {
    if (!userLocation) return false;
    return (
      getDistance(
        userLocation.latitude,
        userLocation.longitude,
        spot.latitude,
        spot.longitude
      ) <= spot.radius + USER_RADIUS
    );
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      <GameMap
        ref={mapRef}
        spots={spots}
        nearbyUsers={nearbyUsers}
        selectedSpotId={selectedSpot?.id}
        selectedUserId={selectedUser?.id}
        userLocation={userLocation}
        onSpotPress={handleSpotPress}
        onUserPress={handleUserPress}
        onMapPress={handleMapPress}
      />

      <UserProfileHUD insets={{ top: topInset }} />
      <BagSidebar
        insets={{ top: topInset, bottom: bottomInset }}
        onLocate={() => mapRef.current?.centerOnUser()}
      />

      {selectedSpot && (
        <View style={[styles.panel, { bottom: bottomInset }]}>
          <SpotPanel
            spot={selectedSpot}
            onClose={() => selectSpot(null)}
            isInRange={isSpotInRange(selectedSpot)}
          />
        </View>
      )}

      {selectedUser && (
        <View style={[styles.panel, { bottom: bottomInset }]}>
          <AttackPanel user={selectedUser} onClose={() => selectUser(null)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.bg,
  },
  panel: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 50,
  },
});
