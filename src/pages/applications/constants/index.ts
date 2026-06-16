import { themeQuartz } from "@/lib/ag-grid";

import type {
  ApplicationDetailMetric,
  ApplicationEnvironmentRecord,
  ApplicationListFilters,
  ApplicationModuleRecord,
  ApplicationPipelineRecord,
  ApplicationStatus,
  ApplicationStatusCode,
} from "../types";

export const applicationStatusCodes: ReadonlySet<ApplicationStatusCode> = new Set([
  "running",
  "maintenance",
  "offline",
]);

export const applicationStatusCodeByLabel: Record<ApplicationStatus, ApplicationStatusCode> = {
  已下线: "offline",
  维护中: "maintenance",
  运行中: "running",
};

export const applicationStatusLabelByCode: Record<ApplicationStatusCode, ApplicationStatus> = {
  maintenance: "维护中",
  offline: "已下线",
  running: "运行中",
};

export const emptyApplicationListFilters: ApplicationListFilters = {
  keyword: "",
  owner: "",
  platform: "",
  status: "",
};

export const applicationStatusClass: Record<ApplicationStatus, string> = {
  已下线: "border-slate-200 bg-slate-50 text-slate-600",
  维护中: "border-amber-200 bg-amber-50 text-amber-700",
  运行中: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export const applicationsGridTheme = themeQuartz.withParams({
  accentColor: "#1677ff",
  backgroundColor: "#ffffff",
  borderColor: "#e5eaf2",
  borderRadius: 0,
  browserColorScheme: "light",
  columnBorder: false,
  fontFamily:
    '"Roboto Flex Variable", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif',
  fontSize: 13,
  foregroundColor: "#334155",
  headerBackgroundColor: "#f8fafc",
  headerFontSize: 12,
  headerFontWeight: 600,
  headerTextColor: "#64748b",
  oddRowBackgroundColor: "#ffffff",
  rowBorder: { color: "#e8edf5", style: "solid", width: 1 },
  rowHoverColor: "#f8fbff",
  selectedRowBackgroundColor: "#eff6ff",
  spacing: 7,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});

export const applicationMetricToneClass: Record<ApplicationDetailMetric["tone"], string> = {
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

export const applicationEnvironmentStatusClass: Record<
  ApplicationEnvironmentRecord["status"],
  string
> = {
  健康: "border-emerald-200 bg-emerald-50 text-emerald-700",
  灰度中: "border-amber-200 bg-amber-50 text-amber-700",
  维护中: "border-slate-200 bg-slate-50 text-slate-600",
};

export const applicationModuleKindClass: Record<ApplicationModuleRecord["kind"], string> = {
  Common: "border-amber-200 bg-amber-50 text-amber-700",
  Feature: "border-sky-200 bg-sky-50 text-sky-700",
};

export const applicationPipelineStatusClass: Record<ApplicationPipelineRecord["status"], string> = {
  failed: "border-red-200 bg-red-50 text-red-600",
  queued: "border-slate-200 bg-slate-50 text-slate-600",
  running: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};
