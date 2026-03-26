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

export default function RegisterScreen() {
  const { mockRegister, setScreen } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      mockRegister();
    }, 1000);
  };

  const handleGoogle = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      mockRegister();
    }, 1000);
  };

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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setScreen("login")}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.dark.textSecondary} />
              <Text style={styles.backText}>Voltar</Text>
            </TouchableOpacity>

            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[COLORS.dark.accent, COLORS.dark.accentDim]}
                  style={styles.logoBg}
                >
                  <Ionicons name="location" size={32} color="#fff" />
                </LinearGradient>
              </View>
              <Text style={styles.appName}>SpotMap</Text>
              <Text style={styles.tagline}>Explore. Compete. Conquer.</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.title}>Criar conta</Text>
              <Text style={styles.subtitle}>Comece sua aventura agora</Text>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogle}
                activeOpacity={0.8}
              >
                <View style={styles.googleIconBox}>
                  <Text style={styles.googleLetter}>G</Text>
                </View>
                <Text style={styles.googleText}>Cadastrar com Google</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>ou com e-mail</Text>
                <View style={styles.divider} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={COLORS.dark.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor={COLORS.dark.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={COLORS.dark.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor={COLORS.dark.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={18}
                      color={COLORS.dark.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirmar senha</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={COLORS.dark.textMuted}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Repita sua senha"
                    placeholderTextColor={COLORS.dark.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirm(!showConfirm)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showConfirm ? "eye-outline" : "eye-off-outline"}
                      size={18}
                      color={COLORS.dark.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.termsText}>
                Ao criar uma conta, você concorda com os{" "}
                <Text style={styles.termsLink}>Termos de Uso</Text> e a{" "}
                <Text style={styles.termsLink}>Política de Privacidade</Text>.
              </Text>

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                activeOpacity={0.85}
                disabled={loading}
              >
                <LinearGradient
                  colors={[COLORS.dark.accent, COLORS.dark.accentDim]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.registerButtonText}>Criar conta</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>Já tem uma conta? </Text>
                <TouchableOpacity onPress={() => setScreen("login")}>
                  <Text style={styles.loginLink}>Entrar</Text>
                </TouchableOpacity>
              </View>
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
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  backText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: COLORS.dark.textSecondary,
    marginLeft: 6,
  },
  header: {
    alignItems: "center",
    marginBottom: 28,
    marginTop: 8,
  },
  logoContainer: {
    marginBottom: 12,
    shadowColor: COLORS.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  logoBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 26,
    color: COLORS.dark.text,
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: COLORS.dark.textSecondary,
    marginTop: 4,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: COLORS.dark.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 22,
    color: COLORS.dark.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLORS.dark.textSecondary,
    marginBottom: 24,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dark.surface,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  googleIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  googleLetter: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4285F4",
  },
  googleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: COLORS.dark.text,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.dark.border,
  },
  dividerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: COLORS.dark.textMuted,
    marginHorizontal: 12,
  },
  inputGroup: {
    marginBottom: 16,
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
  input: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: COLORS.dark.text,
    paddingVertical: 13,
  },
  eyeButton: {
    padding: 4,
  },
  termsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: COLORS.dark.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  termsLink: {
    color: COLORS.dark.accent,
  },
  registerButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: COLORS.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
    letterSpacing: 0.5,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginPrompt: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLORS.dark.textSecondary,
  },
  loginLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: COLORS.dark.accent,
  },
});
