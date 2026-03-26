import React, { createContext, useContext, useState } from "react";

type AuthScreen = "login" | "register" | "onboarding" | "app";

interface AuthContextType {
  screen: AuthScreen;
  setScreen: (screen: AuthScreen) => void;
  mockLogin: () => void;
  mockRegister: () => void;
  mockCompleteOnboarding: () => void;
  mockLogout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [screen, setScreen] = useState<AuthScreen>("login");

  const mockLogin = () => setScreen("app");
  const mockRegister = () => setScreen("onboarding");
  const mockCompleteOnboarding = () => setScreen("app");
  const mockLogout = () => setScreen("login");

  return (
    <AuthContext.Provider
      value={{
        screen,
        setScreen,
        mockLogin,
        mockRegister,
        mockCompleteOnboarding,
        mockLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
