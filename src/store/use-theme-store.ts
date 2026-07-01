import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "forge-console.theme-mode";

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") {
    return stored;
  }

  return "system";
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) {
    return false;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return systemPrefersDark() ? "dark" : "light";
  }

  return mode;
}

function applyResolvedTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

type ThemeStore = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  cycleMode: () => void;
  /** Recompute the resolved theme from the current mode (used on system changes). */
  syncSystem: () => void;
};

const initialMode = readStoredMode();

export const useThemeStore = create<ThemeStore>((set, get) => ({
  mode: initialMode,
  resolvedTheme: resolveTheme(initialMode),
  setMode: (mode) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
    const resolvedTheme = resolveTheme(mode);
    applyResolvedTheme(resolvedTheme);
    set({ mode, resolvedTheme });
  },
  cycleMode: () => {
    const order: ThemeMode[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(get().mode) + 1) % order.length];
    get().setMode(next);
  },
  syncSystem: () => {
    const resolvedTheme = resolveTheme(get().mode);
    applyResolvedTheme(resolvedTheme);
    set({ resolvedTheme });
  },
}));

// Apply the persisted theme as early as this module is imported so the first
// paint already matches. main.tsx imports the store chain before rendering.
applyResolvedTheme(resolveTheme(initialMode));
