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
  accentColor: "#1677ff",
  backgroundColor: "#ffffff",
  borderColor: "#eef2f7",
  borderRadius: 0,
  browserColorScheme: "light",
  columnBorder: false,
  fontFamily:
    '"Roboto Flex Variable", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif',
  fontSize: 13,
  foregroundColor: "#334155",
  headerBackgroundColor: "#ffffff",
  headerFontSize: 12,
  headerFontWeight: 500,
  headerTextColor: "#64748b",
  oddRowBackgroundColor: "#ffffff",
  rowBorder: { color: "#eef2f7", style: "solid", width: 1 },
  rowHoverColor: "#f8fafc",
  selectedRowBackgroundColor: "#eff6ff",
  spacing: 6,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});

export const metricIconToneClass: Record<SummaryMetric["iconTone"], string> = {
  amber: "bg-amber-100 text-amber-600",
  blue: "bg-blue-100 text-blue-600",
  cyan: "bg-cyan-100 text-cyan-600",
  emerald: "bg-emerald-100 text-emerald-600",
  indigo: "bg-indigo-100 text-indigo-600",
  red: "bg-red-100 text-red-600",
  slate: "bg-slate-100 text-slate-600",
  violet: "bg-violet-100 text-violet-600",
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
  failed: "bg-red-100 text-red-700",
  queued: "bg-slate-100 text-slate-700",
  running: "bg-blue-100 text-blue-700",
  success: "bg-emerald-100 text-emerald-700",
};

export const recentBuildStatusLabel: Record<RecentBuildRecord["status"], string> = {
  failed: "失败",
  queued: "排队",
  running: "运行中",
  success: "成功",
};

export const recentReleaseStatusClass: Record<ReleaseRecord["status"], string> = {
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-100 text-slate-700",
};

export const recentReleaseStatusLabel: Record<ReleaseRecord["status"], string> = {
  active: "生效中",
  inactive: "已失效",
};

export const resourceStatusClass: Record<ResourceStatus["status"], string> = {
  attention: "border-amber-200 bg-amber-50 text-amber-700",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};
