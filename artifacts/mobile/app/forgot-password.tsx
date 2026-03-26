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

export default function ForgotPasswordScreen() {
  const { forgotPassword, setScreen } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError("Digite seu e-mail.");
      return;
    }
    setLoading(true);
    setError(null);
    const err = await forgotPassword(email.trim());
    if (err) {
      setError("Não foi possível enviar o e-mail. Verifique o endereço.");
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <LinearGradient colors={[COLORS.dark.bg, COLORS.dark.bgSecondary, COLORS.dark.surface]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.backButton} onPress={() => setScreen("login")}>
              <Ionicons name="arrow-back" size={20} color={COLORS.dark.textSecondary} />
            </TouchableOpacity>

            <View style={styles.top}>
              <Text style={styles.title}>Recuperar senha</Text>
              <Text style={styles.subtitle}>
                {sent
                  ? "E-mail enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha."
                  : "Digite seu e-mail e enviaremos um link para você redefinir sua senha."}
              </Text>
            </View>

            {!sent && (
              <View style={styles.form}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="E-mail"
                    placeholderTextColor={COLORS.dark.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}

                <TouchableOpacity
                  style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                  onPress={handleSend}
                  activeOpacity={0.85}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Enviar link</Text>}
                </TouchableOpacity>
              </View>
            )}

            {sent && (
              <TouchableOpacity style={styles.primaryButton} onPress={() => setScreen("login")} activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>Voltar para o login</Text>
              </TouchableOpacity>
            )}
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
  backButton: { alignSelf: "flex-start", padding: 4, marginBottom: 32 },
  top: { marginBottom: 36 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: COLORS.dark.text, marginBottom: 10 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: COLORS.dark.textSecondary, lineHeight: 22 },
  form: { gap: 12 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.dark.surface, borderRadius: 12,
    paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.dark.border,
  },
  input: { fontFamily: "Inter_400Regular", fontSize: 15, color: COLORS.dark.text, paddingVertical: 15, flex: 1 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.dark.danger, marginTop: -4 },
  primaryButton: { backgroundColor: COLORS.dark.accent, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  primaryButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
});
