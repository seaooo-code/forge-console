import type { RollbackCombinationStatus, RollbackRisk } from "../types";

export const riskClass: Record<RollbackRisk, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  med: "border-amber-200 bg-amber-50 text-amber-700",
};

export const statusClass: Record<RollbackCombinationStatus, string> = {
  可回滚: "border-blue-200 bg-blue-50 text-blue-700",
  已回滚: "border-red-200 bg-red-50 text-red-600",
  运行中: "border-sky-200 bg-sky-50 text-sky-700",
};
