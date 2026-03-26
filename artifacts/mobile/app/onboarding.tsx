import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";

export default function OnboardingScreen() {
  const { mockCompleteOnboarding } = useAuth();
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [loading, setLoading] = useState(false);

  const formatBirthdate = (text: string) => {
    const digits = text.replace(/\D/g, "");
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4) formatted = formatted.slice(0, 5) + "/" + digits.slice(4, 8);
    setBirthdate(formatted.slice(0, 10));
  };

  const handleContinue = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      mockCompleteOnboarding();
    }, 1000);
  };

  const isValid = name.trim().length > 0 && nickname.trim().length > 0 && birthdate.length === 10;

  return (
    <LinearGradient
      colors={[COLORS.dark.bg, COLORS.dark.bgSecondary]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.progressRow}>
              <View style={styles.step}>
                <View style={[styles.stepDot, styles.stepDotDone]}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
                <Text style={[styles.stepLabel, styles.stepLabelDone]}>Conta</Text>
              </View>
              <View style={styles.stepLine} />
              <View style={styles.step}>
                <View style={[styles.stepDot, styles.stepDotActive]}>
                  <Text style={styles.stepNumber}>2</Text>
                </View>
                <Text style={[styles.stepLabel, styles.stepLabelActive]}>Perfil</Text>
              </View>
              <View style={[styles.stepLine, styles.stepLineInactive]} />
              <View style={styles.step}>
                <View style={styles.stepDot}>
                  <Text style={styles.stepNumber}>3</Text>
                </View>
                <Text style={styles.stepLabel}>Jogar</Text>
              </View>
            </View>

            <View style={styles.header}>
              <View style={styles.avatarPlaceholder}>
                <LinearGradient
                  colors={[COLORS.dark.surface, COLORS.dark.surfaceLight]}
                  style={styles.avatarGradient}
                >
                  <Ionicons name="person" size={36} color={COLORS.dark.textMuted} />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Configure seu perfil</Text>
              <Text style={styles.subtitle}>
                Como você quer ser conhecido no campo de batalha?
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nome completo</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={COLORS.dark.textMuted}
                    style={styles.inputIcon}
                  />
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nickname</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.atSymbol}>@</Text>
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
                  {nickname.length > 0 && (
                    <Text style={styles.charCount}>{20 - nickname.length}</Text>
                  )}
                </View>
                <Text style={styles.hint}>
                  Apenas letras, números e underscore. Não pode ser alterado depois.
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Data de nascimento</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="calendar-outline"
                    size={18}
                    color={COLORS.dark.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="DD/MM/AAAA"
                    placeholderTextColor={COLORS.dark.textMuted}
                    value={birthdate}
                    onChangeText={formatBirthdate}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                </View>
                <Text style={styles.hint}>Você precisa ter pelo menos 13 anos.</Text>
              </View>

              <View style={styles.infoBox}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color={COLORS.dark.info}
                  style={{ marginRight: 8, marginTop: 1 }}
                />
                <Text style={styles.infoText}>
                  Suas informações são protegidas e nunca serão compartilhadas com terceiros.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.continueButton,
                  (!isValid || loading) && styles.buttonDisabled,
                ]}
                onPress={handleContinue}
                activeOpacity={0.85}
                disabled={!isValid || loading}
              >
                <LinearGradient
                  colors={
                    isValid
                      ? [COLORS.dark.accent, COLORS.dark.accentDim]
                      : [COLORS.dark.surface, COLORS.dark.surfaceLight]
                  }
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={[styles.continueText, !isValid && styles.continueTextDisabled]}>
                        Começar a jogar
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={isValid ? "#fff" : COLORS.dark.textMuted}
                        style={{ marginLeft: 6 }}
                      />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  step: {
    alignItems: "center",
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.dark.surface,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  stepDotDone: {
    backgroundColor: COLORS.dark.accent,
    borderColor: COLORS.dark.accent,
  },
  stepDotActive: {
    backgroundColor: COLORS.dark.accentGlow,
    borderColor: COLORS.dark.accent,
    borderWidth: 2,
  },
  stepNumber: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: COLORS.dark.textMuted,
  },
  stepLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: COLORS.dark.textMuted,
  },
  stepLabelDone: {
    color: COLORS.dark.accent,
  },
  stepLabelActive: {
    color: COLORS.dark.text,
    fontFamily: "Inter_600SemiBold",
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.dark.accent,
    marginHorizontal: 8,
    marginBottom: 20,
  },
  stepLineInactive: {
    backgroundColor: COLORS.dark.border,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: "hidden",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.dark.border,
  },
  avatarGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: COLORS.dark.text,
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLORS.dark.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: COLORS.dark.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: COLORS.dark.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dark.surface,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  atSymbol: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: COLORS.dark.accent,
    marginRight: 6,
  },
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: COLORS.dark.text,
    paddingVertical: 13,
  },
  charCount: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: COLORS.dark.textMuted,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    color: COLORS.dark.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: COLORS.dark.infoGlow,
    borderWidth: 1,
    borderColor: COLORS.dark.info,
    borderRadius: 10,
    padding: 12,
    marginBottom: 24,
  },
  infoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: COLORS.dark.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  continueButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: COLORS.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  buttonDisabled: {
    shadowOpacity: 0,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  continueText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
    letterSpacing: 0.5,
  },
  continueTextDisabled: {
    color: COLORS.dark.textMuted,
  },
});
