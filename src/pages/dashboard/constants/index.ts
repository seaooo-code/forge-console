import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  Boxes,
  Database,
  GitBranch,
  HardDrive,
  KeyRound,
  Rocket,
  ServerCog,
} from "lucide-react";

import { themeQuartz } from "@/lib/ag-grid";

import type {
  MetricIconName,
  RecentBuildRecord,
  ReleaseRecord,
  ResourceStatus,
  SummaryMetric,
} from "../types";

export const dashboardSummaryGridTheme = themeQuartz.withParams({
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
  headerFontSize: 12,
  headerFontWeight: 500,
  headerTextColor: "var(--muted-foreground)",
  oddRowBackgroundColor: "var(--card)",
  rowBorder: { color: "var(--border)", style: "solid", width: 1 },
  rowHoverColor: "color-mix(in oklch, var(--primary) 8%, transparent)",
  selectedRowBackgroundColor: "color-mix(in oklch, var(--primary) 12%, transparent)",
  spacing: 6,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});

export const metricIconToneClass: Record<SummaryMetric["iconTone"], string> = {
  amber: "bg-warning/15 text-warning",
  blue: "bg-info/15 text-info",
  cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-300",
  emerald: "bg-success/15 text-success",
  indigo: "bg-primary/15 text-primary",
  red: "bg-destructive/15 text-destructive",
  slate: "bg-muted text-muted-foreground",
  violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300",
};

export const metricIcons: Record<MetricIconName, LucideIcon> = {
  accessToken: KeyRound,
  app: AppWindow,
  build: GitBranch,
  codeSource: Database,
  environment: ServerCog,
  module: Boxes,
  release: Rocket,
  storage: HardDrive,
};

export const recentBuildStatusClass: Record<RecentBuildRecord["status"], string> = {
  failed: "bg-destructive/15 text-destructive",
  queued: "bg-muted text-muted-foreground",
  running: "bg-info/15 text-info",
  success: "bg-success/15 text-success",
};

export const recentBuildStatusLabel: Record<RecentBuildRecord["status"], string> = {
  failed: "失败",
  queued: "排队",
  running: "运行中",
  success: "成功",
};

export const recentReleaseStatusClass: Record<ReleaseRecord["status"], string> = {
  active: "bg-success/15 text-success",
  inactive: "bg-muted text-muted-foreground",
};

export const recentReleaseStatusLabel: Record<ReleaseRecord["status"], string> = {
  active: "生效中",
  inactive: "已失效",
};

export const resourceStatusClass: Record<ResourceStatus["status"], string> = {
  attention: "border-warning/40 bg-warning/10 text-warning",
  healthy: "border-success/30 bg-success/10 text-success",
  neutral: "border-border bg-muted text-muted-foreground",
};
