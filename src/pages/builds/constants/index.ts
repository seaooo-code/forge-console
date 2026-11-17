import type { BuildPlatform, BuildRecordDetail, BuildRunStatus, BuildTriggerType } from "../types";

export const buildStatusClass: Record<BuildRunStatus, string> = {
  failed: "bg-destructive-soft text-destructive",
  queued: "bg-warning/14 text-warning-foreground dark:text-warning",
  running: "bg-info-soft text-info",
  success: "bg-success/12 text-success",
};

/** 列表摘要里的状态项，id 与构建列表接口的 status 筛选值一致；空字符串表示全部。 */
export const buildStatusSummaryItems = [
  { filter: "", key: "total", label: "全部", tone: "default" },
  { filter: "running", key: "running", label: "构建中", tone: "info" },
  { filter: "pending", key: "queued", label: "排队中", tone: "warning" },
  { filter: "succeeded", key: "success", label: "成功", tone: "success" },
  { filter: "failed", key: "failed", label: "失败", tone: "destructive" },
] as const;

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
  harmonyos: "HarmonyOS",
  ios: "iOS",
};

export const repositoryProviderLabels: Record<BuildRecordDetail["repositoryProvider"], string> = {
  github: "GitHub",
  gitlab: "GitLab",
};

/** 构建详情轮询间隔：状态 5 秒一次，日志按后端方案 2 秒一次。 */
export const buildDetailRefetchIntervalMs = 5000;

export const buildLogsRefetchIntervalMs = 2000;
