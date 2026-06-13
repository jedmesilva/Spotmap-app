import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import COLORS from "@/constants/colors";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const AVATAR_OPTIONS = [
  "😎", "🦊", "🐺", "🦁", "🐯", "🐻", "🦝", "🐼",
  "🦄", "🐲", "👾", "🤖", "👻", "💀", "🎭", "🔥",
  "⚡", "❄️", "🌊", "🌙", "⭐", "💎", "🎯", "🗡️",
];

const isImageUrl = (value: string) =>
  value.startsWith("http://") || value.startsWith("https://");

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "email-address";
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.dark.textMuted}
        keyboardType={keyboardType ?? "default"}
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { userProfile, updateProfile } = useAuth();

  const [name, setName] = useState(userProfile?.name ?? "");
  const [nickname, setNickname] = useState(userProfile?.nickname ?? "");
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(userProfile?.avatar ?? "😎");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const uploadAvatarToBackend = async (uri: string, mimeType: string): Promise<string | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;

    const base64 = await fetch(uri)
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );

    const domain = process.env.EXPO_PUBLIC_DOMAIN;
    const apiUrl = domain ? `https://${domain}/api` : "http://localhost:8080/api";

    const response = await fetch(`${apiUrl}/upload/avatar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ base64, mimeType }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? "Erro ao fazer upload da imagem");
    }

    const { url } = await response.json();
    return url;
  };

  const handlePickImage = async (useCamera: boolean) => {
    try {
      let result: ImagePicker.ImagePickerResult;

      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permissão negada", "Precisamos de acesso à câmera para tirar sua foto.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: "images",
          quality: 0.7,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permissão negada", "Precisamos de acesso à galeria para escolher sua foto.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: "images",
          quality: 0.7,
        });
      }

      if (result.canceled) return;

      const asset = result.assets[0];
      setUploadingAvatar(true);
      const url = await uploadAvatarToBackend(asset.uri, asset.mimeType ?? "image/jpeg");
      if (url) {
        setSelectedAvatar(url);
        await updateProfile({ avatar: url });
      }
    } catch (err: any) {
      Alert.alert("Erro", err.message ?? "Não foi possível fazer upload da imagem.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !nickname.trim()) {
      Alert.alert("Erro", "Preencha nome e nickname.");
      return;
    }

    setSaving(true);
    const error = await updateProfile({
      name: name.trim(),
      nickname: nickname.trim(),
      avatar: selectedAvatar,
    });
    setSaving(false);

    if (error) {
      Alert.alert("Erro", error);
      return;
    }

    Alert.alert("Salvo!", "Suas informações foram atualizadas.", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.dark.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.dark.text} />
          ) : (
            <Text style={styles.saveText}>Salvar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setAvatarPickerVisible(true)}
            activeOpacity={0.8}
            disabled={uploadingAvatar}
          >
            <View style={styles.avatar}>
              {uploadingAvatar ? (
                <ActivityIndicator size="large" color={COLORS.dark.accent} />
              ) : isImageUrl(selectedAvatar) ? (
                <Image
                  source={{ uri: selectedAvatar }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{selectedAvatar}</Text>
              )}
            </View>
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={12} color={COLORS.dark.bg} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>
            {uploadingAvatar ? "Enviando..." : "Toque para alterar"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações</Text>
          <Field label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" />
          <Field label="Nickname" value={nickname} onChangeText={setNickname} placeholder="@seunickname" />
        </View>
      </ScrollView>

      <Modal
        visible={avatarPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAvatarPickerVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setAvatarPickerVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Escolha seu avatar</Text>
            <View style={styles.emojiGrid}>
              {AVATAR_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    selectedAvatar === emoji && styles.emojiOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedAvatar(emoji);
                    setAvatarPickerVisible(false);
                  }}
                >
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={() => {
                setAvatarPickerVisible(false);
                handlePickImage(false);
              }}
            >
              <Ionicons name="images-outline" size={18} color={COLORS.dark.accent} />
              <Text style={styles.galleryButtonText}>Usar imagem da galeria</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.dark.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.text,
  },
  saveButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: COLORS.dark.accent,
    borderRadius: 10,
    minWidth: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    paddingVertical: 28,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.dark.border,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.dark.bgSecondary,
    borderWidth: 2.5,
    borderColor: COLORS.dark.accent,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarText: {
    fontSize: 40,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.dark.accent,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.dark.bg,
  },
  avatarHint: {
    marginTop: 10,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: COLORS.dark.textMuted,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: COLORS.dark.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.dark.surface,
    borderWidth: 1,
    borderColor: COLORS.dark.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: COLORS.dark.text,
  },
  inputFocused: {
    borderColor: COLORS.dark.accent,
  },
  galleryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.dark.accent,
  },
  galleryButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: COLORS.dark.accent,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.dark.bgSecondary,
    borderRadius: 20,
    padding: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: COLORS.dark.text,
    marginBottom: 16,
    textAlign: "center",
  },
  emojiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  emojiOption: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: COLORS.dark.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  emojiOptionSelected: {
    borderColor: COLORS.dark.accent,
    backgroundColor: COLORS.dark.accentGlow,
  },
  emojiText: {
    fontSize: 26,
  },
});
