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

import { useColors } from "@/hooks/useColors";
import { NearbyUser } from "@/context/GameContext";

export const EMOJI_BAR_HEIGHT = 94;

const EMOJIS = [
  "😂", "🔥", "💀", "👏", "😤", "🤡", "💪", "👑",
  "😈", "⚡", "🎯", "💣", "🤣", "😱", "🏆", "🫡",
  "💅", "🐢", "🥶", "😴",
];

interface FloatingEmoji {
  id: number;
  emoji: string;
  anim: Animated.Value;
  opacity: Animated.Value;
}

interface EmojiBarProps {
  user: NearbyUser;
  bottomInset: number;
  onSendEmoji?: (emoji: string) => void;
}

export function EmojiBar({ user, bottomInset, onSendEmoji }: EmojiBarProps) {
  const C = useColors();
  const slideAnim = useRef(new Animated.Value(120)).current;
  const [floaters, setFloaters] = useState<FloatingEmoji[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 70,
      friction: 11,
    }).start();
  }, []);

  const handleEmojiPress = useCallback((emoji: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onSendEmoji?.(emoji);

    const id = ++counterRef.current;
    const anim = new Animated.Value(0);
    const opacity = new Animated.Value(1);

    setFloaters((prev) => [...prev.slice(-4), { id, emoji, anim, opacity }]);

    Animated.parallel([
      Animated.timing(anim, {
        toValue: -100,
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
              bottom: bottomInset + EMOJI_BAR_HEIGHT + 16,
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
          {
            bottom: bottomInset + 10,
            backgroundColor: C.card,
            borderColor: C.border,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.label}>
          <Text style={[styles.labelText, { color: C.textMuted }]}>Enviar para </Text>
          <Text style={[styles.labelName, { color: C.accent }]}>{user.name}</Text>
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
              style={({ pressed }) => [
                styles.emojiBtn,
                {
                  backgroundColor: pressed ? C.accent + "22" : C.surface,
                  borderColor: pressed ? C.accent + "66" : C.border,
                  transform: pressed ? [{ scale: 0.88 }] : [],
                },
              ]}
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
    left: 16,
    right: 16,
    borderRadius: 20,
    borderWidth: 1,
    paddingTop: 10,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 20,
  },
  label: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  labelText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  labelName: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  scroll: {
    paddingHorizontal: 10,
    gap: 6,
  },
  emojiBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  emoji: {
    fontSize: 24,
  },
  floater: {
    position: "absolute",
    alignSelf: "center",
    fontSize: 38,
    zIndex: 100,
  },
});
