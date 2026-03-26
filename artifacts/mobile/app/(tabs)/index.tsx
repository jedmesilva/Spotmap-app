import React, { useCallback, useEffect, useRef } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import * as Location from "expo-location";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";
import { GameMap, GameMapHandle } from "@/components/GameMap";
import { SpotPanel } from "@/components/SpotPanel";
import { BagSidebar } from "@/components/BagSidebar";
import { UserProfileHUD } from "@/components/UserProfileHUD";
import { MedalsStrip } from "@/components/MedalsStrip";
import { EmojiBar, EMOJI_BAR_HEIGHT } from "@/components/EmojiBar";
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
    userProfile,
    mineSpot,
    activeCollection,
  } = useGame();

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 500,
          distanceInterval: 1,
        },
        (loc) => {
          setUserLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      );
    })();
    return () => { sub?.remove(); };
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

  const spotsInRange = spots.filter((s) => isSpotInRange(s));
  const mineableSpotId = activeCollection?.spotId
    ?? (selectedSpot && isSpotInRange(selectedSpot) ? selectedSpot.id : null)
    ?? (spotsInRange.length > 0 ? spotsInRange[0].id : null);
  const canMine = mineableSpotId !== null;
  const miningProgress = activeCollection?.progress ?? 0;
  const miningClicks = activeCollection?.clicks ?? 0;

  return (
    <View style={styles.container}>
      <GameMap
        ref={mapRef}
        spots={spots}
        nearbyUsers={nearbyUsers}
        selectedSpotId={selectedSpot?.id}
        selectedUserId={selectedUser?.id}
        userLocation={userLocation}
        userProfile={userProfile}
        onSpotPress={handleSpotPress}
        onUserPress={handleUserPress}
        onMapPress={handleMapPress}
      />

      <UserProfileHUD insets={{ top: topInset }} />
      <MedalsStrip insets={{ top: topInset }} />

      <View style={[styles.rightButtons, { top: topInset + 16 }]}>
        {selectedUser ? (
          <>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => mapRef.current?.centerOn(selectedUser.latitude, selectedUser.longitude)}
              activeOpacity={0.75}
            >
              <Ionicons name="locate" size={22} color={COLORS.dark.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapBtn, styles.exitBtn]}
              onPress={() => selectUser(null)}
              activeOpacity={0.75}
            >
              <Feather name="x" size={20} color={COLORS.dark.danger} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => mapRef.current?.centerOnUser()}
            activeOpacity={0.75}
          >
            <Ionicons name="locate" size={22} color={COLORS.dark.accent} />
          </TouchableOpacity>
        )}
      </View>

      <BagSidebar
        insets={{ top: topInset, bottom: bottomInset }}
        onMine={() => {
          if (!mineableSpotId) return;
          mineSpot(mineableSpotId);
          mapRef.current?.mineHit(mineableSpotId, miningClicks + 1);
        }}
        canMine={canMine}
        miningProgress={miningProgress}
        miningClicks={miningClicks}
        extraBottomOffset={selectedUser ? EMOJI_BAR_HEIGHT + 10 : 0}
      />

      {selectedSpot && (
        <SpotPanel
          spot={selectedSpot}
          onClose={() => selectSpot(null)}
          isInRange={isSpotInRange(selectedSpot)}
        />
      )}

      {selectedUser && (
        <EmojiBar
          user={selectedUser}
          bottomInset={bottomInset}
          onSendEmoji={(emoji) =>
            mapRef.current?.sendEmojiReaction(selectedUser.id, emoji)
          }
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.bg,
  },
  rightButtons: {
    position: "absolute",
    right: 16,
    flexDirection: "column",
    gap: 8,
    zIndex: 10,
  },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.dark.card,
    borderWidth: 1.5,
    borderColor: COLORS.dark.accent + "44",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  exitBtn: {
    borderColor: COLORS.dark.danger + "44",
  },
});
