import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ThemeMode, useThemeStore } from "@/store/use-theme-store";

const themeOptions: { icon: typeof Sun; label: string; mode: ThemeMode }[] = [
  { icon: Sun, label: "浅色", mode: "light" },
  { icon: Moon, label: "深色", mode: "dark" },
  { icon: Monitor, label: "跟随系统", mode: "system" },
];

export function ThemeSwitch() {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);

  return (
    <fieldset className="m-0 inline-flex gap-px rounded-lg border-0 bg-muted p-0.5">
      <legend className="sr-only">外观</legend>
      {themeOptions.map(({ icon: Icon, label, mode: optionMode }) => (
        <Button
          key={optionMode}
          variant="ghost"
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={mode === optionMode}
          onClick={() => setMode(optionMode)}
          className={cn(
            "size-6 rounded-md p-0 text-faint hover:bg-transparent hover:text-foreground [&_svg]:size-3.5",
            mode === optionMode && "bg-background text-foreground shadow-edge hover:bg-background",
          )}
        >
          <Icon />
        </Button>
      ))}
    </fieldset>
  );
}
