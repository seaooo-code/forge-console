import type { LucideIcon } from "lucide-react";
import { AppWindow, Boxes, GitBranch, Package, Rocket, Workflow } from "lucide-react";

import { themeQuartz } from "@/lib/ag-grid";

import type { DevTask, MetricIconName, ReleaseRecord, SummaryMetric } from "../types";

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
  green: "bg-emerald-100 text-emerald-600",
  red: "bg-red-100 text-red-600",
  sky: "bg-sky-100 text-sky-600",
};

export const metricIcons: Record<MetricIconName, LucideIcon> = {
  app: AppWindow,
  bundle: Package,
  module: Boxes,
  pipeline: GitBranch,
  release: Rocket,
  task: Workflow,
};

export const recentReleaseStatusClass: Record<ReleaseRecord["status"], string> = {
  已回滚: "bg-red-100 text-red-700",
  已完成: "bg-emerald-100 text-emerald-700",
  灰度中: "bg-amber-100 text-amber-700",
};

export const recentTaskStatusClass: Record<DevTask["status"], string> = {
  dev: "bg-sky-100 text-sky-700",
  done: "bg-emerald-100 text-emerald-700",
  review: "bg-violet-100 text-violet-700",
  test: "bg-amber-100 text-amber-700",
};
