import type { BundleCompositionKind, CombinationStatus } from "../types";

export const bundleKindClass: Record<BundleCompositionKind, string> = {
  Common: "border-amber-200 bg-amber-50 text-amber-700",
  Feature: "border-blue-200 bg-blue-50 text-blue-700",
};

export const statusClass: Record<CombinationStatus, string> = {
  历史版本: "border-slate-200 bg-slate-50 text-slate-600",
  已回滚: "border-rose-200 bg-rose-50 text-rose-600",
  滚动更新: "border-blue-200 bg-blue-50 text-blue-700",
  运行中: "border-emerald-200 bg-emerald-50 text-emerald-700",
};
