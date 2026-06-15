import type { DevTaskStatus, PipelineRunStatus, RelatedModuleStatus } from "../types";

export const moduleStatusClass: Record<RelatedModuleStatus, string> = {
  失败: "border-red-200 bg-red-50 text-red-600",
  成功: "border-emerald-200 bg-emerald-50 text-emerald-700",
  构建中: "border-sky-200 bg-sky-50 text-sky-700",
};

export const pipelineRunClass: Record<PipelineRunStatus, string> = {
  failed: "border-red-200 bg-red-50 text-red-600",
  running: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export const taskStatusClass: Record<DevTaskStatus, string> = {
  已发布: "border-emerald-200 bg-emerald-50 text-emerald-700",
  已挂起: "border-slate-200 bg-slate-50 text-slate-600",
  待发布: "border-violet-200 bg-violet-50 text-violet-700",
  开发中: "border-sky-200 bg-sky-50 text-sky-700",
  测试中: "border-amber-200 bg-amber-50 text-amber-700",
  联调中: "border-blue-200 bg-blue-50 text-blue-700",
};
