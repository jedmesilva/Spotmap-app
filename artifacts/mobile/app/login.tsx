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

export default function LoginScreen() {
  const { mockLogin, setScreen } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      mockLogin();
    }, 1000);
  };

  const handleGoogle = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      mockLogin();
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
              <Text style={styles.title}>Entrar</Text>
              <Text style={styles.subtitle}>Bem-vindo de volta, jogador</Text>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogle}
                activeOpacity={0.8}
              >
                <View style={styles.googleIconBox}>
                  <Text style={styles.googleLetter}>G</Text>
                </View>
                <Text style={styles.googleText}>Continuar com Google</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>ou</Text>
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
                    placeholder="••••••••"
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

              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>Esqueceu a senha?</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                activeOpacity={0.85}
                disabled={loading}
              >
                <LinearGradient
                  colors={[COLORS.dark.accent, COLORS.dark.accentDim]}
                  style={styles.loginGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginText}>Entrar</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.registerRow}>
                <Text style={styles.registerPrompt}>Não tem uma conta? </Text>
                <TouchableOpacity onPress={() => setScreen("register")}>
                  <Text style={styles.registerLink}>Criar conta</Text>
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
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 36,
    marginTop: 16,
  },
  logoContainer: {
    marginBottom: 12,
    shadowColor: COLORS.dark.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  logoBg: {
    width: 68,
    height: 68,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: COLORS.dark.text,
    letterSpacing: 4,
  },
  tagline: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
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
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 24,
    marginTop: -4,
  },
  forgotText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: COLORS.dark.accent,
  },
  loginButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: COLORS.dark.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#fff",
    letterSpacing: 0.5,
  },
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerPrompt: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: COLORS.dark.textSecondary,
  },
  registerLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: COLORS.dark.accent,
  },
});
