import React, { useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Circle } from "react-native-maps";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import COLORS from "@/constants/colors";
import { useGame } from "@/context/GameContext";
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

function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { spots, nearbyUsers, selectedSpot, selectedUser, selectSpot, selectUser, userLocation, setUserLocation } = useGame();
  const mapRef = useRef<MapView>(null);

  const [locationPermission, setLocationPermission] = useState<string | null>(null);
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
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setUserLocation(coords);
        setRegion((prev) => ({ ...prev, ...coords }));
      }
    })();
  }, []);

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
        onPress={() => {
          selectSpot(null);
          selectUser(null);
        }}
      >
        {spots.map((spot) => (
          <React.Fragment key={spot.id}>
            <Circle
              center={{ latitude: spot.latitude, longitude: spot.longitude }}
              radius={spot.radius}
              fillColor={SPOT_COLORS[spot.type] + "18"}
              strokeColor={SPOT_COLORS[spot.type] + "66"}
              strokeWidth={1.5}
            />
            <SpotMarker
              spot={spot}
              isSelected={selectedSpot?.id === spot.id}
              onPress={() => selectSpot(spot)}
            />
          </React.Fragment>
        ))}

        {userLocation && (
          <Circle
            center={userLocation}
            radius={USER_RADIUS}
            fillColor={COLORS.dark.accentGlow}
            strokeColor={COLORS.dark.accent + "88"}
            strokeWidth={2}
          />
        )}

        {nearbyUsers.map((user) => (
          <UserMarker
            key={user.id}
            user={user}
            isSelected={selectedUser?.id === user.id}
            onPress={() => selectUser(user)}
          />
        ))}
      </MapView>

      <UserProfileHUD insets={{ top: topInset }} />

      <BagSidebar insets={{ top: topInset, bottom: bottomInset }} />

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

      {locationPermission && locationPermission !== "granted" && (
        <View style={[styles.permissionBanner, { top: topInset + 90 }]}>
          <Text style={styles.permissionText}>
            Localização necessária para jogar
          </Text>
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
  permissionBanner: {
    position: "absolute",
    left: 16,
    right: 16,
    backgroundColor: COLORS.dark.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.dark.warning,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 20,
  },
  permissionText: {
    color: COLORS.dark.warning,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
