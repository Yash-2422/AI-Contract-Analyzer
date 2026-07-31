import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/types/api";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setSession: (accessToken: string, refreshToken: string, user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

/**
 * Persisted to localStorage so a page reload doesn't force a re-login.
 *
 * Trade-off worth knowing: storing tokens in localStorage (rather than an
 * httpOnly cookie) means they're readable by any JS running on the page,
 * so an XSS vulnerability elsewhere in the app could exfiltrate them. The
 * backend (Phase 2) issues bearer tokens, not cookies, so this is the
 * matching approach - if you want httpOnly cookie storage instead, that's
 * a backend change (Set-Cookie on login/refresh) plus removing this
 * persistence, not just a frontend swap.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (accessToken, refreshToken, user) =>
        set({ accessToken, refreshToken, user }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: "aca-auth" },
  ),
);