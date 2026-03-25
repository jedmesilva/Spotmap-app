import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import COLORS from "@/constants/colors";
import { NearbyUser } from "@/context/GameContext";

const EMOJIS = [
  "😂", "🔥", "💀", "👏", "😤", "🤡", "💪", "👑",
  "😈", "⚡", "🎯", "💣", "🤣", "😱", "🏆", "🫡",
  "💅", "🐢", "🥶", "😴",
];

interface EmojiBarProps {
  user: NearbyUser;
  bottomInset: number;
}

interface FloatingEmoji {
  id: number;
  emoji: string;
  anim: Animated.Value;
  opacity: Animated.Value;
}

export function EmojiBar({ user, bottomInset }: EmojiBarProps) {
  const slideAnim = useRef(new Animated.Value(80)).current;
  const [floaters, setFloaters] = useState<FloatingEmoji[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 70,
      friction: 11,
    }).start();
    return () => {
      Animated.timing(slideAnim, {
        toValue: 80,
        duration: 180,
        useNativeDriver: true,
      }).start();
    };
  }, []);

  const handleEmojiPress = useCallback((emoji: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const id = ++counterRef.current;
    const anim = new Animated.Value(0);
    const opacity = new Animated.Value(1);

    setFloaters((prev) => [...prev.slice(-4), { id, emoji, anim, opacity }]);

    Animated.parallel([
      Animated.timing(anim, {
        toValue: -90,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id));
    });
  }, []);

  return (
    <>
      {floaters.map((f) => (
        <Animated.Text
          key={f.id}
          style={[
            styles.floater,
            {
              transform: [{ translateY: f.anim }],
              opacity: f.opacity,
            },
          ]}
        >
          {f.emoji}
        </Animated.Text>
      ))}

      <Animated.View
        style={[
          styles.container,
          { paddingBottom: bottomInset + 8, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.label}>
          <Text style={styles.labelText}>Enviar para </Text>
          <Text style={styles.labelName}>{user.name}</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => handleEmojiPress(emoji)}
              style={({ pressed }) => [styles.emojiBtn, pressed && styles.emojiBtnPressed]}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.dark.card ?? COLORS.dark.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.dark.border,
    paddingTop: 10,
  },
  label: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 12,
    color: COLORS.dark.textMuted ?? COLORS.dark.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  labelName: {
    fontSize: 12,
    color: COLORS.dark.accent,
    fontFamily: "Inter_700Bold",
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 6,
    paddingBottom: 4,
  },
  emojiBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.dark.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.dark.border,
  },
  emojiBtnPressed: {
    backgroundColor: COLORS.dark.accent + "22",
    borderColor: COLORS.dark.accent + "66",
    transform: [{ scale: 0.9 }],
  },
  emoji: {
    fontSize: 24,
  },
  floater: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    fontSize: 36,
    zIndex: 100,
  },
});
