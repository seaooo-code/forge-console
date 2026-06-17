import type { PipelineDefinitionStatus, PipelineStepType } from "../types";

export const pipelineStatusClass: Record<PipelineDefinitionStatus, string> = {
  disabled: "border-slate-200 bg-slate-50 text-slate-600",
  enabled: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export const pipelineStepLabels: Record<PipelineStepType, string> = {
  build: "构建",
  deploy: "部署",
  notify: "通知",
  test: "测试",
  upload_artifact: "上传产物",
};
