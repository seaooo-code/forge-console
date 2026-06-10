import { create } from "zustand";

import type { AuthSession } from "@/types/auth";

type AuthState = {
  isSessionLoading: boolean;
  session: AuthSession | null;
  setSessionLoading: (isSessionLoading: boolean) => void;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  isSessionLoading: true,
  session: null,
  setSessionLoading: (isSessionLoading) => set({ isSessionLoading }),
  setSession: (session) => {
    window.localStorage.removeItem("forge-console.auth-session");
    set({ isSessionLoading: false, session });
  },
  clearSession: () => {
    window.localStorage.removeItem("forge-console.auth-session");
    set({ isSessionLoading: false, session: null });
  },
}));
