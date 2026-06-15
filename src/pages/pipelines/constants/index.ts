import type { PipelineStatus, PipelineStepStatus } from "../types";

export const runStatusClass: Record<PipelineStatus, string> = {
  canceled: "border-slate-200 bg-slate-50 text-slate-600",
  failed: "border-red-200 bg-red-50 text-red-600",
  queued: "border-amber-200 bg-amber-50 text-amber-700",
  running: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export const stepClass: Record<PipelineStepStatus, string> = {
  done: "border-emerald-600 bg-emerald-600 text-white",
  pending: "border-slate-200 bg-slate-100 text-slate-400",
  running: "border-blue-600 bg-blue-600 text-white",
};
