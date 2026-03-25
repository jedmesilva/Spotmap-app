import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Callout, Marker } from "react-native-maps";

import COLORS from "@/constants/colors";
import { Spot } from "@/context/GameContext";

const SPOT_COLORS: Record<string, string> = {
  coupon: COLORS.dark.spotCoupon,
  money: COLORS.dark.spotMoney,
  product: COLORS.dark.spotProduct,
  rare: COLORS.dark.spotRare,
};

const SPOT_ICONS: Record<string, string> = {
  coupon: "tag",
  money: "dollar-sign",
  product: "box",
  rare: "star",
};

interface SpotMarkerProps {
  spot: Spot;
  isSelected: boolean;
  onPress: () => void;
}

export function SpotMarker({ spot, isSelected, onPress }: SpotMarkerProps) {
  const color = SPOT_COLORS[spot.type] ?? COLORS.dark.accent;
  const iconName = SPOT_ICONS[spot.type] ?? "map-pin";

  return (
    <Marker
      coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
      onPress={onPress}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={false}
    >
      {/*
        Padding externo garante que o bitmap do Android não corte o conteúdo.
        Nenhuma sombra ou elevation dentro do Marker — isso causava o clipping.
      */}
      <View style={styles.padding}>
        <View
          style={[
            styles.outer,
            {
              borderColor: isSelected ? color : color + "70",
              backgroundColor: isSelected ? color + "30" : color + "15",
            },
          ]}
        >
          <View
            style={[
              styles.inner,
              {
                backgroundColor: isSelected
                  ? color + "35"
                  : COLORS.dark.bgSecondary,
                borderColor: color,
              },
            ]}
          >
            <Feather name={iconName as any} size={15} color={color} />
          </View>
        </View>

        {spot.isCollecting && (
          <View
            style={[
              styles.dot,
              { backgroundColor: COLORS.dark.accent },
            ]}
          />
        )}
      </View>
      {/* Suppress the default Google Maps navigation callout */}
      <Callout tooltip>
        <View />
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  /* padding buffer: prevents Android bitmap snapshot from clipping */
  padding: {
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  outer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  inner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    /* NO shadow/elevation — causes bitmap clipping on Android */
  },
  dot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.dark.bg,
  },
});
