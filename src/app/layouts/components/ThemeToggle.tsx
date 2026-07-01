import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { type ThemeMode, useThemeStore } from "@/store/use-theme-store";

const nextLabel: Record<ThemeMode, string> = {
  light: "切换为深色",
  dark: "跟随系统",
  system: "切换为浅色",
};

const icons: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

/**
 * Three-state theme control (light → dark → system → …). Reflects the current
 * mode and cycles on click. Drives the global theme store.
 */
export function ThemeToggle() {
  const mode = useThemeStore((state) => state.mode);
  const cycleMode = useThemeStore((state) => state.cycleMode);
  const Icon = icons[mode];

  return (
    <Button
      variant="ghost"
      size="icon"
      type="button"
      aria-label={nextLabel[mode]}
      title={nextLabel[mode]}
      onClick={cycleMode}
    >
      <Icon className="size-4" />
    </Button>
  );
}
