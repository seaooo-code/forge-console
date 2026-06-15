import { AlertTriangle, type LucideIcon, RadioTower, ShieldCheck, UsersRound } from "lucide-react";

import type { GrayHistoryRecord, GrayStatus } from "../types";

export const graySteps = [1, 5, 10, 20, 50, 100];

export const actionClass: Record<GrayHistoryRecord["action"], string> = {
  全量: "border-emerald-200 bg-emerald-50 text-emerald-700",
  回滚: "border-red-200 bg-red-50 text-red-600",
  推进: "border-blue-200 bg-blue-50 text-blue-700",
};

export const statusClass: Record<GrayStatus, string> = {
  已全量: "border-emerald-200 bg-emerald-50 text-emerald-700",
  推进中: "border-amber-200 bg-amber-50 text-amber-700",
};

export const summaryIconClass: Record<string, string> = {
  active: "bg-blue-50 text-blue-600",
  alerts: "bg-red-50 text-red-600",
  health: "bg-emerald-50 text-emerald-600",
  users: "bg-violet-50 text-violet-600",
};

export const summaryIconMap: Record<string, LucideIcon> = {
  active: RadioTower,
  alerts: AlertTriangle,
  health: ShieldCheck,
  users: UsersRound,
};
