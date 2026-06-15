import type { BundleStatus } from "../types";

export const bundleStatusClass: Record<BundleStatus, string> = {
  已发布: "border-emerald-200 bg-emerald-50 text-emerald-700",
  已归档: "border-slate-200 bg-slate-50 text-slate-600",
  已驳回: "border-red-200 bg-red-50 text-red-600",
  草稿: "border-sky-200 bg-sky-50 text-sky-700",
};
