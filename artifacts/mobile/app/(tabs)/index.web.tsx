import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import COLORS from "@/constants/colors";

export default function MapScreenWeb() {
  return (
    <View style={styles.container}>
      <Feather name="smartphone" size={48} color={COLORS.dark.accent} />
      <Text style={styles.title}>SpotMap</Text>
      <Text style={styles.sub}>Disponível apenas no app mobile</Text>
      <Text style={styles.hint}>Escaneie o QR code com o Expo Go para jogar</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  title: {
    color: COLORS.dark.text,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  sub: {
    color: COLORS.dark.textSecondary,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  hint: {
    color: COLORS.dark.textMuted,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
