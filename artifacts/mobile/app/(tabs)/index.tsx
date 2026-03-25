import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  View,
} from "react-native";
import MapView, { Circle } from "react-native-maps";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import COLORS from "@/constants/colors";
import { Spot, NearbyUser, useGame } from "@/context/GameContext";
import { SpotMarker } from "@/components/SpotMarker";
import { UserMarker } from "@/components/UserMarker";
import { SpotPanel } from "@/components/SpotPanel";
import { AttackPanel } from "@/components/AttackPanel";
import { BagSidebar } from "@/components/BagSidebar";
import { UserProfileHUD } from "@/components/UserProfileHUD";

const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#050A14" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#3D6080" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#050A14" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1E3A5F" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#0D1B2E" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1E3A5F" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#132A4A" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#03080F" }] },
];

const SPOT_COLORS: Record<string, string> = {
  coupon: COLORS.dark.spotCoupon,
  money: COLORS.dark.spotMoney,
  product: COLORS.dark.spotProduct,
  rare: COLORS.dark.spotRare,
};

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

type ScreenPositions = Record<string, { x: number; y: number }>;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
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

  const mapRef = useRef<MapView>(null);
  const [locationPermission, setLocationPermission] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [spotPositions, setSpotPositions] = useState<ScreenPositions>({});
  const [userPositions, setUserPositions] = useState<ScreenPositions>({});

  const [region, setRegion] = useState({
    latitude: -23.5505,
    longitude: -46.6333,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);
      if (status === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(coords);
        setRegion((prev) => ({ ...prev, ...coords }));
      }
    })();
  }, []);

  const recalcPositions = useCallback(async () => {
    if (!mapRef.current || !mapReady) return;

    const newSpotPos: ScreenPositions = {};
    for (const spot of spots) {
      try {
        const pt = await mapRef.current.pointForCoordinate({
          latitude: spot.latitude,
          longitude: spot.longitude,
        });
        newSpotPos[spot.id] = pt;
      } catch (_) {}
    }
    setSpotPositions(newSpotPos);

    const newUserPos: ScreenPositions = {};
    for (const user of nearbyUsers) {
      try {
        const pt = await mapRef.current.pointForCoordinate({
          latitude: user.latitude,
          longitude: user.longitude,
        });
        newUserPos[user.id] = pt;
      } catch (_) {}
    }
    setUserPositions(newUserPos);
  }, [mapReady, spots, nearbyUsers]);

  useEffect(() => {
    if (mapReady) recalcPositions();
  }, [mapReady, recalcPositions]);

  const handleRegionChange = useCallback(() => {
    recalcPositions();
  }, [recalcPositions]);

  const isSpotInRange = (spot: { latitude: number; longitude: number; radius: number }) => {
    if (!userLocation) return false;
    const dist = getDistance(
      userLocation.latitude,
      userLocation.longitude,
      spot.latitude,
      spot.longitude
    );
    return dist <= spot.radius + USER_RADIUS;
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.container}>
      {/* ─── Map (circles stay inside MapView) ─── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        customMapStyle={Platform.OS !== "web" ? MAP_STYLE : undefined}
        initialRegion={region}
        showsUserLocation={locationPermission === "granted"}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsPointsOfInterest={false}
        onMapReady={() => setMapReady(true)}
        onRegionChange={handleRegionChange}
        onRegionChangeComplete={handleRegionChange}
        onPress={() => {
          selectSpot(null);
          selectUser(null);
        }}
      >
        {/* Radius circles per spot */}
        {spots.map((spot) => (
          <Circle
            key={spot.id}
            center={{ latitude: spot.latitude, longitude: spot.longitude }}
            radius={spot.radius}
            fillColor={SPOT_COLORS[spot.type] + "18"}
            strokeColor={SPOT_COLORS[spot.type] + "66"}
            strokeWidth={1.5}
          />
        ))}

        {/* User radius */}
        {userLocation && (
          <Circle
            center={userLocation}
            radius={USER_RADIUS}
            fillColor={COLORS.dark.accentGlow}
            strokeColor={COLORS.dark.accent + "88"}
            strokeWidth={2}
          />
        )}
      </MapView>

      {/* ─── Spot markers — plain RN views over the map ─── */}
      {spots.map((spot) => {
        const pos = spotPositions[spot.id];
        if (!pos) return null;
        return (
          <SpotMarker
            key={spot.id}
            spot={spot}
            isSelected={selectedSpot?.id === spot.id}
            position={pos}
            onPress={() => selectSpot(spot)}
          />
        );
      })}

      {/* ─── User markers — plain RN views over the map ─── */}
      {nearbyUsers.map((user) => {
        const pos = userPositions[user.id];
        if (!pos) return null;
        return (
          <UserMarker
            key={user.id}
            user={user}
            isSelected={selectedUser?.id === user.id}
            position={pos}
            onPress={() => selectUser(user)}
          />
        );
      })}

      {/* ─── HUD ─── */}
      <UserProfileHUD insets={{ top: topInset }} />

      {/* ─── Right sidebar bag ─── */}
      <BagSidebar insets={{ top: topInset, bottom: bottomInset }} />

      {/* ─── Bottom panels ─── */}
      {selectedSpot && (
        <View style={[styles.panelContainer, { bottom: bottomInset }]}>
          <SpotPanel
            spot={selectedSpot}
            onClose={() => selectSpot(null)}
            isInRange={isSpotInRange(selectedSpot)}
          />
        </View>
      )}

      {selectedUser && (
        <View style={[styles.panelContainer, { bottom: bottomInset }]}>
          <AttackPanel
            user={selectedUser}
            onClose={() => selectUser(null)}
          />
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
  panelContainer: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
