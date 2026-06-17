export type BuildRunStatus = "canceled" | "failed" | "queued" | "running" | "success";

export type BuildTriggerType = "manual" | "pipeline";

export type BuildReleaseType = "full" | "targeted";

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

export type BuildRecordDetail = BuildRunRecord & {
  artifactUrl: string;
  createdAt: string;
  defaultBranch: string;
  environment: string;
  environmentName: string;
  errorMessage: string;
  finishedAt: string;
  moduleId: string;
  queuedAt: string;
  repositoryFullName: string;
  repositoryId: string;
  repositoryInstallationId: string;
  repositoryProvider: string;
  startedAtFull: string;
  startedAtRaw: string;
  storageConfigurationId: string;
  storageConfigurationName: string;
  updatedAt: string;
  workerId: string;
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

export type BuildReleaseFormState = {
  identifier: string;
  releaseType: BuildReleaseType;
};
