import { useEffect } from "react";

import { useThemeStore } from "@/store/use-theme-store";

/**
 * Keeps the resolved theme in sync with the OS preference while the mode is
 * "system". Mounted once near the app root. The `.dark` class itself is applied
 * imperatively inside the store, so this hook only reacts to system changes.
 */
export function useSystemThemeSync() {
  const mode = useThemeStore((state) => state.mode);
  const syncSystem = useThemeStore((state) => state.syncSystem);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    // Re-apply on mount in case the mode changed since the last system sync.
    syncSystem();

    if (mode !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => syncSystem();
    media.addEventListener("change", handleChange);

    return () => media.removeEventListener("change", handleChange);
  }, [mode, syncSystem]);
}
