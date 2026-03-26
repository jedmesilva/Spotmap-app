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

export default function LoginScreen() {
  const { login, setScreen } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    setError(null);
    const err = await login(email.trim(), password);
    if (err) setError(translateError(err));
    setLoading(false);
  };

  return (
    <LinearGradient colors={[COLORS.dark.bg, COLORS.dark.bgSecondary, COLORS.dark.surface]} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.top}>
              <Text style={styles.appName}>SpotMap</Text>
              <Text style={styles.subtitle}>Entre na sua conta</Text>
            </View>

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

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Senha"
                  placeholderTextColor={COLORS.dark.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eye}>
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color={COLORS.dark.textMuted} />
                </TouchableOpacity>
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity style={styles.forgotButton} onPress={() => setScreen("forgot-password")}>
                <Text style={styles.forgotText}>Esqueceu a senha?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem conta? </Text>
              <TouchableOpacity onPress={() => setScreen("register")}>
                <Text style={styles.footerLink}>Criar conta</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function translateError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "E-mail ou senha incorretos.";
  if (msg.includes("Email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (msg.includes("rate limit")) return "Muitas tentativas. Aguarde um momento.";
  return msg;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, justifyContent: "center", paddingVertical: 48 },
  top: { marginBottom: 40 },
  appName: { fontFamily: "Inter_700Bold", fontSize: 32, color: COLORS.dark.text, marginBottom: 6 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, color: COLORS.dark.textSecondary },
  form: { gap: 12 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.dark.surface, borderRadius: 12,
    paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.dark.border,
  },
  input: { fontFamily: "Inter_400Regular", fontSize: 15, color: COLORS.dark.text, paddingVertical: 15, flex: 1 },
  eye: { padding: 4 },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.dark.danger, marginTop: -4 },
  forgotButton: { alignSelf: "flex-end", marginTop: 2, marginBottom: 4 },
  forgotText: { fontFamily: "Inter_400Regular", fontSize: 13, color: COLORS.dark.accent },
  primaryButton: { backgroundColor: COLORS.dark.accent, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  primaryButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 40 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.dark.textSecondary },
  footerLink: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.dark.accent },
});
