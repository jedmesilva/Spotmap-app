import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type AuthScreen = "loading" | "login" | "register" | "forgot-password" | "onboarding" | "app";

export interface UserProfile {
  id: string;
  name: string;
  nickname: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  health: number;
  max_health: number;
  coins: number;
}

interface AuthContextType {
  screen: AuthScreen;
  setScreen: (screen: AuthScreen) => void;
  session: Session | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string) => Promise<string | null>;
  completeOnboarding: (name: string, nickname: string) => Promise<string | null>;
  forgotPassword: (email: string) => Promise<string | null>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (fields: { name?: string; nickname?: string; email?: string; avatar?: string; password?: string }) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<AuthScreen>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const loadProfile = async (user: User): Promise<boolean> => {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) {
      setUserProfile(data as UserProfile);
      return true;
    }
    return false;
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const hasProfile = await loadProfile(session.user);
        setScreen(hasProfile ? "app" : "onboarding");
      } else {
        setScreen("login");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (!session) {
        setUserProfile(null);
        setScreen("login");
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const hasProfile = await loadProfile(user);
      setScreen(hasProfile ? "app" : "onboarding");
    }
    return null;
  };

  const register = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    setScreen("onboarding");
    return null;
  };

  const completeOnboarding = async (name: string, nickname: string): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "Sessão expirada. Faça login novamente.";

    const avatar = name.trim().charAt(0).toUpperCase();
    const { error } = await supabase.from("users").insert({
      id: user.id,
      auth_id: user.id,
      name: name.trim(),
      nickname: nickname.trim().toLowerCase(),
      email: user.email,
      avatar,
    });

    if (error) {
      if (error.code === "23505") return "Esse nickname já está em uso. Escolha outro.";
      return error.message;
    }

    await loadProfile(user);
    setScreen("app");
    return null;
  };

  const forgotPassword = async (email: string): Promise<string | null> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) return error.message;
    return null;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    setScreen("login");
  };

  const refreshProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await loadProfile(user);
  };

  const updateProfile = async (fields: { name?: string; nickname?: string; email?: string; avatar?: string; password?: string }): Promise<string | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return "Sessão expirada. Faça login novamente.";

    const { password, email, ...profileFields } = fields;

    if (Object.keys(profileFields).length > 0) {
      const { error } = await supabase.from("users").update(profileFields).eq("id", user.id);
      if (error) {
        if (error.code === "23505") return "Esse nickname já está em uso. Escolha outro.";
        return error.message;
      }
    }

    if (email && email !== user.email) {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) return error.message;
    }

    if (password) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return error.message;
    }

    await loadProfile(user);
    return null;
  };

  return (
    <AuthContext.Provider value={{
      screen, setScreen, session, userProfile,
      login, register, completeOnboarding, forgotPassword, logout, refreshProfile, updateProfile,
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
