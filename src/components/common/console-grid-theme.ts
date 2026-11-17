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
  headerBackgroundColor: "var(--card)",
  headerColumnBorder: false,
  headerColumnResizeHandleColor: "transparent",
  headerRowBorder: false,
  headerFontSize: 12,
  headerFontWeight: 600,
  headerTextColor: "var(--muted-foreground)",
  oddRowBackgroundColor: "var(--card)",
  pinnedColumnBorder: false,
  rowBorder: false,
  rowHoverColor: "var(--hover)",
  selectedRowBackgroundColor: "var(--primary-wash)",
  spacing: 7,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});
