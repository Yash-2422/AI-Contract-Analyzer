import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/api";

interface AuthState {
  refreshToken: string | null;
  user: User | null;
  setSession: (refreshToken: string, user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
}


export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      refreshToken: null,
      user: null,
      setSession: (refreshToken, user) =>
        set({ refreshToken, user }),
      setTokens: (accessToken, refreshToken) => set({ refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ refreshToken: null, user: null }),
    }),
    { name: "aca-auth" },
  ),
);
