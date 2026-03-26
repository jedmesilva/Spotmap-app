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
    setTimeout(() => { setLoading(false); mockCompleteOnboarding(); }, 1000);
  };

  const isValid = name.trim().length > 0 && nickname.trim().length > 0 && birthdate.length === 10;

  return (
    <View style={styles.container}>
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

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Data de nascimento</Text>
                <View style={styles.inputWrapper}>
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
              </View>
            </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.dark.bg },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 48,
    justifyContent: "center",
  },
  top: {
    marginBottom: 40,
  },
  step: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: COLORS.dark.accent,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: COLORS.dark.text,
    lineHeight: 36,
  },
  form: {
    gap: 24,
    marginBottom: 40,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: COLORS.dark.textSecondary,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dark.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  at: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: COLORS.dark.accent,
    marginRight: 4,
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: COLORS.dark.text,
    paddingVertical: 15,
    flex: 1,
  },
  hint: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: COLORS.dark.textMuted,
  },
  primaryButton: {
    backgroundColor: COLORS.dark.accent,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: COLORS.dark.surface,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  primaryButtonText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#fff",
  },
});
