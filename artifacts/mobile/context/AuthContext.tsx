import React, { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AuthScreen = "loading" | "app";

export interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  email: string;
  avatar: string;
  health: number;
  max_health: number;
  coins: number;
  strength: number;
}

interface AuthContextType {
  screen: AuthScreen;
  setScreen: (screen: AuthScreen) => void;
  session: Session | null;
  userProfile: UserProfile | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (fields: { name?: string; nickname?: string; avatar?: string }) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function generateNickname(): string {
  const adjectives = ["swift", "bold", "dark", "iron", "wild", "frost", "storm", "fire", "shadow", "neon"];
  const nouns = ["wolf", "hawk", "bear", "fox", "raven", "viper", "tiger", "lynx", "eagle", "shark"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}${noun}${num}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<AuthScreen>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const loadProfile = async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) {
      setUserProfile(data as UserProfile);
      return true;
    }
    return false;
  };

  const createAnonymousProfile = async (userId: string): Promise<void> => {
    const nickname = generateNickname();
    const name = nickname.charAt(0).toUpperCase() + nickname.slice(1);
    const avatar = "😎";

    const { error } = await supabase.from("users").insert({
      id: userId,
      auth_id: userId,
      name,
      nickname,
      email: `${nickname}@anon.spotmap`,
      avatar,
    });

    if (!error) {
      await loadProfile(userId);
    }
  };

  useEffect(() => {
    const init = async () => {
      let { data: { session: existingSession } } = await supabase.auth.getSession();

      if (!existingSession) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error || !data.session) {
          setScreen("app");
          return;
        }
        existingSession = data.session;
      }

      setSession(existingSession);

      if (existingSession?.user) {
        const hasProfile = await loadProfile(existingSession.user.id);
        if (!hasProfile) {
          await createAnonymousProfile(existingSession.user.id);
        }
      }

      setScreen("app");
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (!session) {
        setUserProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await loadProfile(user.id);
  };

  const updateProfile = async (fields: { name?: string; nickname?: string; avatar?: string }): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "Sessão expirada.";

    const { error } = await supabase.from("users").update(fields).eq("id", user.id);
    if (error) {
      if (error.code === "23505") return "Esse nickname já está em uso. Escolha outro.";
      return error.message;
    }

    await loadProfile(user.id);
    return null;
  };

  return (
    <AuthContext.Provider value={{
      screen, setScreen, session, userProfile,
      refreshProfile, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
