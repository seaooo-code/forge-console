import { themeQuartz } from "@/lib/ag-grid";

// Colors are driven by the app's CSS custom properties (see index.css), so the
// grid follows the global light/dark theme with a single definition — no
// per-consumer theme switching required.
export const consoleGridTheme = themeQuartz.withParams({
  accentColor: "var(--primary)",
  backgroundColor: "var(--card)",
  borderColor: "var(--border)",
  borderRadius: 0,
  browserColorScheme: "inherit",
  columnBorder: false,
  fontFamily: "var(--app-font-sans)",
  fontSize: 13,
  foregroundColor: "var(--card-foreground)",
  headerBackgroundColor: "var(--surface-2)",
  headerFontSize: 12,
  headerFontWeight: 600,
  headerTextColor: "var(--muted-foreground)",
  oddRowBackgroundColor: "var(--card)",
  rowBorder: { color: "var(--border)", style: "solid", width: 1 },
  rowHoverColor: "color-mix(in oklch, var(--primary) 8%, transparent)",
  selectedRowBackgroundColor: "color-mix(in oklch, var(--primary) 12%, transparent)",
  spacing: 7,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});
