import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, TouchableOpacity, View, useColorScheme } from "react-native";
import * as Location from "expo-location";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGame } from "@/context/GameContext";
import { GameMap, GameMapHandle } from "@/components/GameMap";
import { CombatButtons } from "@/components/CombatButtons";
import { InventoryButton } from "@/components/InventoryButton";
import { UserProfileHUD } from "@/components/UserProfileHUD";
import { MedalsStrip } from "@/components/MedalsStrip";
import { EmojiBar, EMOJI_BAR_HEIGHT } from "@/components/EmojiBar";
import { Vignette } from "@/components/Vignette";
import { useColors } from "@/hooks/useColors";

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
  const C = useColors();
  const colorScheme = useColorScheme();
  const theme = colorScheme === "light" ? "light" : "dark";

  const {
    spots,
    nearbyUsers,
    selectedSpot,
    selectedUser,
    selectedInventorySpot,
    selectSpot,
    selectUser,
    userLocation,
    setUserLocation,
    userProfile,
    fireInventorySpot,
    activeCollection,
  } = useGame();

  // Tracks the spot the user manually exited focus on (prevents auto-refocus until they leave+re-enter radius)
  const manuallyUnfocusedRef = useRef<string | null>(null);
  // Tracks which spot IDs were in range on the previous location update
  const prevInRangeSetRef = useRef<Set<string>>(new Set());

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
            accuracy: loc.coords.accuracy ?? undefined,
          });
        }
      );
    })();
    return () => { sub?.remove(); };
  }, []);

  const isSpotInRange = useCallback(
    (spot: { latitude: number; longitude: number; radius: number }) => {
      if (!userLocation) return false;
      return (
        getDistance(
          userLocation.latitude,
          userLocation.longitude,
          spot.latitude,
          spot.longitude
        ) <= spot.radius
      );
    },
    [userLocation]
  );

  const spotsInRange = useMemo(
    () => spots.filter((s) => isSpotInRange(s)),
    [spots, isSpotInRange]
  );

  // Auto-focus when entering a spot radius; reset manual-unfocus when exiting radius
  useEffect(() => {
    const currentIds = new Set(spotsInRange.map((s) => s.id));
    const prevIds = prevInRangeSetRef.current;

    for (const spot of spotsInRange) {
      if (!prevIds.has(spot.id)) {
        // Entered this spot's radius
        if (!selectedSpot && manuallyUnfocusedRef.current !== spot.id) {
          selectSpot(spot);
          selectUser(null);
        }
      }
    }

    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        // Exited this spot's radius — reset manual-unfocus so next entry auto-focuses
        if (manuallyUnfocusedRef.current === id) {
          manuallyUnfocusedRef.current = null;
        }
      }
    }

    prevInRangeSetRef.current = currentIds;
  }, [spotsInRange]);

  const handleSpotPress = useCallback(
    (spotId: string) => {
      const spot = spots.find((s) => s.id === spotId);
      // Explicit click always focuses, even if previously manually unfocused
      if (manuallyUnfocusedRef.current === spotId) {
        manuallyUnfocusedRef.current = null;
      }
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

  // X button on a spot: mark as manually unfocused to suppress auto-refocus until next radius exit+entry
  const handleUnfocusSpot = useCallback(() => {
    manuallyUnfocusedRef.current = selectedSpot?.id ?? null;
    selectSpot(null);
  }, [selectedSpot, selectSpot]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  // canMine requires a focused (selected) spot that is in range, or an active collection already running
  const mineableSpotId = activeCollection?.spotId
    ?? (selectedSpot && isSpotInRange(selectedSpot) ? selectedSpot.id : null);
  const canMine = mineableSpotId !== null;
  const miningProgress = activeCollection?.progress ?? 0;
  const miningClicks = activeCollection?.clicks ?? 0;

  return (
    <View style={[styles.container, { backgroundColor: C.bg }]}>
      <GameMap
        ref={mapRef}
        spots={spots}
        nearbyUsers={nearbyUsers}
        selectedSpotId={selectedSpot?.id}
        selectedUserId={selectedUser?.id}
        mineableSpotId={mineableSpotId}
        userLocation={userLocation}
        userProfile={userProfile}
        activeCollection={activeCollection ? { spotId: activeCollection.spotId, progress: activeCollection.progress } : null}
        theme={theme}
        onSpotPress={handleSpotPress}
        onUserPress={handleUserPress}
        onMapPress={handleMapPress}
      />

      <Vignette
        isFocused={!!(selectedSpot || selectedUser)}
        health={userProfile.health}
        maxHealth={userProfile.maxHealth}
      />

      <UserProfileHUD insets={{ top: topInset }} />
      <MedalsStrip insets={{ top: topInset }} />

      <View style={[styles.rightButtons, { top: topInset + 16 }]}>
        {selectedUser ? (
          <>
            <TouchableOpacity
              style={[styles.mapBtn, { backgroundColor: C.card, borderColor: C.accent + "44" }]}
              onPress={() => mapRef.current?.centerOn(selectedUser.latitude, selectedUser.longitude)}
              activeOpacity={0.75}
            >
              <Ionicons name="locate" size={22} color={C.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapBtn, { backgroundColor: C.card, borderColor: C.danger + "44" }]}
              onPress={() => selectUser(null)}
              activeOpacity={0.75}
            >
              <Feather name="x" size={20} color={C.danger} />
            </TouchableOpacity>
          </>
        ) : selectedSpot ? (
          <>
            <TouchableOpacity
              style={[styles.mapBtn, { backgroundColor: C.card, borderColor: C.accent + "44" }]}
              onPress={() => mapRef.current?.centerOn(selectedSpot.latitude, selectedSpot.longitude)}
              activeOpacity={0.75}
            >
              <Ionicons name="locate" size={22} color={C.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mapBtn, { backgroundColor: C.card, borderColor: C.danger + "44" }]}
              onPress={handleUnfocusSpot}
              activeOpacity={0.75}
            >
              <Feather name="x" size={20} color={C.danger} />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.mapBtn, { backgroundColor: C.card, borderColor: C.accent + "44" }]}
            onPress={() => mapRef.current?.centerOnUser()}
            activeOpacity={0.75}
          >
            <Ionicons name="locate" size={22} color={C.accent} />
          </TouchableOpacity>
        )}
      </View>

      <CombatButtons
        insets={{ bottom: bottomInset }}
        canAttack={!!selectedInventorySpot && (canMine || !!selectedUser)}
        miningClicks={miningClicks}
        onAttack={() => {
          fireInventorySpot(mineableSpotId);
          const itemType = selectedInventorySpot?.type ?? "rare";
          if (selectedUser) {
            mapRef.current?.fireAtUser(selectedUser.id, itemType);
          } else if (mineableSpotId) {
            mapRef.current?.mineHit(mineableSpotId, miningClicks + 1);
            mapRef.current?.fireAtSpot(mineableSpotId, itemType);
          }
        }}
        onDefend={() => {}}
        extraBottomOffset={selectedUser ? EMOJI_BAR_HEIGHT + 10 : 0}
      />

      <InventoryButton
        insets={{ bottom: bottomInset }}
        extraBottomOffset={selectedUser ? EMOJI_BAR_HEIGHT + 10 : 0}
      />

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
  },
  rightButtons: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    gap: 8,
    zIndex: 10,
  },
  mapBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
});
