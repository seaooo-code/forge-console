/**
 * Reads resolved theme colors from the app's CSS custom properties so non-CSS
 * consumers (e.g. ECharts canvas) can match the active light/dark theme. Call
 * inside an effect keyed on the resolved theme so values are re-read on change.
 */
export type ThemeChartColors = {
  primary: string;
  accent: string;
  foreground: string;
  mutedForeground: string;
  border: string;
  muted: string;
  success: string;
  warning: string;
  info: string;
  destructive: string;
};

function readVar(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name).trim();
  return value || fallback;
}

export function getThemeChartColors(): ThemeChartColors {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      primary: "#4f46e5",
      accent: "#0ea5b7",
      foreground: "#1e293b",
      mutedForeground: "#64748b",
      border: "#e2e8f0",
      muted: "#f1f5f9",
      success: "#16a34a",
      warning: "#d97706",
      info: "#2563eb",
      destructive: "#dc2626",
    };
  }

  const styles = getComputedStyle(document.documentElement);

  return {
    primary: readVar(styles, "--primary", "#4f46e5"),
    accent: readVar(styles, "--chart-2", "#0ea5b7"),
    foreground: readVar(styles, "--foreground", "#1e293b"),
    mutedForeground: readVar(styles, "--muted-foreground", "#64748b"),
    border: readVar(styles, "--border", "#e2e8f0"),
    muted: readVar(styles, "--muted", "#f1f5f9"),
    success: readVar(styles, "--success", "#16a34a"),
    warning: readVar(styles, "--warning", "#d97706"),
    info: readVar(styles, "--info", "#2563eb"),
    destructive: readVar(styles, "--destructive", "#dc2626"),
  };
}
