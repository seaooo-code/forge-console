import type { BuildRunStatus, BuildTriggerType } from "../types";

export const buildStatusClass: Record<BuildRunStatus, string> = {
  canceled: "border-border bg-muted text-muted-foreground",
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  queued: "border-warning/40 bg-warning/10 text-warning",
  running: "border-info/30 bg-info/10 text-info",
  success: "border-success/30 bg-success/10 text-success",
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
