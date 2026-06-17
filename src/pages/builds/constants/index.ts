import type { BuildRunStatus, BuildTriggerType } from "../types";

export const buildStatusClass: Record<BuildRunStatus, string> = {
  canceled: "border-slate-200 bg-slate-50 text-slate-600",
  failed: "border-red-200 bg-red-50 text-red-600",
  queued: "border-amber-200 bg-amber-50 text-amber-700",
  running: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export const buildStatusLabels: Record<BuildRunStatus, string> = {
  canceled: "已取消",
  failed: "失败",
  queued: "排队中",
  running: "构建中",
  success: "成功",
};

export const buildTriggerLabels: Record<BuildTriggerType, string> = {
  manual: "手动触发",
  pipeline: "流水线触发",
};
