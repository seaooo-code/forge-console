import { create } from "zustand";

import type { AuthSession } from "@/types/auth";

const authSessionStorageKey = "forge-console.auth-session";

type AuthState = {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: readStoredSession(),
  setSession: (session) => {
    writeStoredSession(session);
    set({ session });
  },
  clearSession: () => {
    window.localStorage.removeItem(authSessionStorageKey);
    set({ session: null });
  },
}));

function readStoredSession(): AuthSession | null {
  try {
    const rawSession = window.localStorage.getItem(authSessionStorageKey);
    if (!rawSession) {
      return null;
    }

    const session = JSON.parse(rawSession) as Partial<AuthSession>;
    if (!session.user?.unionId) {
      return null;
    }

    return session as AuthSession;
  } catch {
    window.localStorage.removeItem(authSessionStorageKey);
    return null;
  }
}

function writeStoredSession(session: AuthSession) {
  window.localStorage.setItem(authSessionStorageKey, JSON.stringify(session));
}
