import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = name.trim().length >= 2 && nickname.trim().length >= 2;

  const handleContinue = async () => {
    if (!isValid) return;
    setLoading(true);
    setError(null);
    const err = await completeOnboarding(name, nickname);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <LinearGradient colors={[COLORS.dark.bg, COLORS.dark.bgSecondary, COLORS.dark.surface]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.top}>
              <Text style={styles.step}>Quase lá</Text>
              <Text style={styles.title}>Como você quer{"\n"}ser chamado?</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nome</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Seu nome"
                    placeholderTextColor={COLORS.dark.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nickname</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.at}>@</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="seu_nickname"
                    placeholderTextColor={COLORS.dark.textMuted}
                    value={nickname}
                    onChangeText={(t) => setNickname(t.replace(/\s/g, "").toLowerCase())}
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={20}
                  />
                </View>
                <Text style={styles.hint}>Não poderá ser alterado depois</Text>
              </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.primaryButton, (!isValid || loading) && styles.buttonDisabled]}
              onPress={handleContinue}
              activeOpacity={0.85}
              disabled={!isValid || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>Começar a jogar</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 48, justifyContent: "center" },
  top: { marginBottom: 40 },
  step: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.dark.accent, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: COLORS.dark.text, lineHeight: 36 },
  form: { gap: 24, marginBottom: 32 },
  fieldGroup: { gap: 8 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, color: COLORS.dark.textSecondary },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.dark.surface, borderRadius: 12,
    paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.dark.border,
  },
  at: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: COLORS.dark.accent, marginRight: 4 },
  input: { fontFamily: "Inter_400Regular", fontSize: 15, color: COLORS.dark.text, paddingVertical: 15, flex: 1 },
  hint: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.dark.textMuted },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.dark.danger, marginBottom: 12 },
  primaryButton: { backgroundColor: COLORS.dark.accent, borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  buttonDisabled: { backgroundColor: COLORS.dark.surface },
  buttonContent: { flexDirection: "row", alignItems: "center" },
  primaryButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
});
