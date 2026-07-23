"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User } from "@/lib/types";
import { users } from "@/lib/mock-data";

const STORAGE_KEY = "kolhub_auth_v1";
export const DEMO_PASSWORD = "123456";

interface AuthContextValue {
  user: User | null;
  loaded: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { id: string };
        const found = users.find((u) => u.id === saved.id);
        if (found) setUser(found);
      }
    } catch {
      /* bỏ qua */
    }
    setLoaded(true);
  }, []);

  const login = useCallback((email: string, password: string) => {
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u) return { ok: false, error: "Email không tồn tại trong hệ thống." };
    if (password !== DEMO_PASSWORD) return { ok: false, error: "Mật khẩu không đúng." };
    setUser(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: u.id }));
    } catch {
      /* bỏ qua */
    }
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* bỏ qua */
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loaded, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải dùng bên trong <AuthProvider>");
  return ctx;
}
