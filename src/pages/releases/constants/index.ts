import type { ReleaseStatus, ReleaseTimelineStatus } from "../types";

export const statusClass: Record<ReleaseStatus, string> = {
  已回滚: "border-red-200 bg-red-50 text-red-600",
  已完成: "border-emerald-200 bg-emerald-50 text-emerald-700",
  待审批: "border-amber-200 bg-amber-50 text-amber-700",
  灰度中: "border-orange-200 bg-orange-50 text-orange-700",
};

export const timelineClass: Record<ReleaseTimelineStatus, string> = {
  done: "border-emerald-600 bg-emerald-600 text-white",
  pending: "border-slate-300 bg-white text-slate-300",
  running: "border-blue-600 bg-white text-blue-600",
};
