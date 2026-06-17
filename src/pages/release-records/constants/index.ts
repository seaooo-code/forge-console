import type { ReleaseRecordStatus, ReleaseRecordTriggerType } from "../types";

export const releaseRecordStatusClass: Record<ReleaseRecordStatus, string> = {
  canceled: "border-slate-200 bg-slate-50 text-slate-600",
  failed: "border-red-200 bg-red-50 text-red-600",
  queued: "border-amber-200 bg-amber-50 text-amber-700",
  running: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export const releaseRecordTriggerLabels: Record<ReleaseRecordTriggerType, string> = {
  manual: "手动指向",
  pipeline: "流水线指向",
  release_task: "发布任务",
};
