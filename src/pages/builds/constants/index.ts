import type { BuildPlatform, BuildRecordDetail, BuildRunStatus, BuildTriggerType } from "../types";

export const buildStatusClass: Record<BuildRunStatus, string> = {
  failed: "border-destructive/30 bg-destructive/10 text-destructive",
  queued: "border-warning/40 bg-warning/10 text-warning",
  running: "border-info/30 bg-info/10 text-info",
  success: "border-success/30 bg-success/10 text-success",
};

export const buildStatusLabels: Record<BuildRunStatus, string> = {
  failed: "失败",
  queued: "排队中",
  running: "构建中",
  success: "成功",
};

export const buildTriggerLabels: Record<BuildTriggerType, string> = {
  manual: "手动触发",
  webhook: "Webhook 触发",
};

export const buildTriggerFilterOptions = (
  Object.keys(buildTriggerLabels) as BuildTriggerType[]
).map((value) => ({ label: buildTriggerLabels[value], value }));

export const buildPlatformLabels: Record<BuildPlatform, string> = {
  android: "Android",
  harmony: "HarmonyOS",
  ios: "iOS",
};

export const repositoryProviderLabels: Record<BuildRecordDetail["repositoryProvider"], string> = {
  github: "GitHub",
  gitlab: "GitLab",
};

/** 构建详情轮询间隔：状态 5 秒一次，日志按后端方案 2 秒一次。 */
export const buildDetailRefetchIntervalMs = 5000;

export const buildLogsRefetchIntervalMs = 2000;
