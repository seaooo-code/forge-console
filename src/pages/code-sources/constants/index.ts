import type { CodeSourceAppStatus, CodeSourceProvider } from "../types";

export const providerToneClass: Record<CodeSourceProvider, string> = {
  github: "bg-slate-950 text-white",
};

export const statusClass: Record<CodeSourceAppStatus, string> = {
  installed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  notInstalled: "border-slate-200 bg-slate-50 text-slate-600",
};

export const statusLabel: Record<CodeSourceAppStatus, string> = {
  installed: "已安装",
  notInstalled: "未安装",
};
