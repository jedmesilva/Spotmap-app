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

export default function RegisterScreen() {
  const { register, setScreen } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      setError("Preencha todos os campos.");
      return;
    }
    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    setError(null);
    const err = await register(email.trim(), password);
    if (err) setError(translateError(err));
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
              <Text style={styles.title}>Criar conta</Text>
              <Text style={styles.subtitle}>Comece sua jornada no SpotMap</Text>
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

              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar senha"
                  placeholderTextColor={COLORS.dark.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Criar conta</Text>}
              </TouchableOpacity>
            </View>

            <Text style={styles.termsText}>
              Ao criar uma conta você concorda com os{" "}
              <Text style={styles.termsLink}>Termos de Uso</Text> e{" "}
              <Text style={styles.termsLink}>Política de Privacidade</Text>.
            </Text>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem conta? </Text>
              <TouchableOpacity onPress={() => setScreen("login")}>
                <Text style={styles.footerLink}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function translateError(msg: string): string {
  if (msg.includes("already registered") || msg.includes("already been registered")) return "Este e-mail já está cadastrado.";
  if (msg.includes("invalid email")) return "E-mail inválido.";
  if (msg.includes("Password should be")) return "A senha deve ter pelo menos 6 caracteres.";
  if (msg.includes("rate limit")) return "Muitas tentativas. Aguarde um momento.";
  return msg;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingVertical: 24, justifyContent: "center" },
  backButton: { alignSelf: "flex-start", padding: 4, marginBottom: 32 },
  top: { marginBottom: 36 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: COLORS.dark.text, marginBottom: 6 },
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
  primaryButton: { backgroundColor: COLORS.dark.accent, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
  primaryButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  termsText: { fontFamily: "Inter_400Regular", fontSize: 12, color: COLORS.dark.textMuted, lineHeight: 18, marginTop: 24, textAlign: "center" },
  termsLink: { color: COLORS.dark.textSecondary },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 14, color: COLORS.dark.textSecondary },
  footerLink: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: COLORS.dark.accent },
});
