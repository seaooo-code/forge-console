export type BuildRunStatus = "canceled" | "failed" | "queued" | "running" | "success";

export type BuildTriggerType = "manual" | "pipeline";

export type BuildRunRecord = {
  application: string;
  artifact: string;
  branch: string;
  commit: string;
  duration: string;
  id: string;
  module: string;
  operator: string;
  startedAt: string;
  status: BuildRunStatus;
  triggerId: string;
  triggerType: BuildTriggerType;
  version: string;
};

export type BuildsSnapshot = {
  builds: BuildRunRecord[];
  summary: {
    failed: number;
    queued: number;
    running: number;
    success: number;
    total: number;
  };
};
