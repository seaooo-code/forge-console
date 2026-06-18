export type BuildRunStatus = "canceled" | "failed" | "queued" | "running" | "success";

export type BuildTriggerType = "manual" | "pipeline";

export type BuildReleaseType = "full" | "targeted";

export type BuildRunRecord = {
  application: string;
  artifact: string;
  branch: string;
  commit: string;
  createdAt: string;
  createdAtRaw: string;
  duration: string;
  environment: string;
  id: string;
  module: string;
  moduleId: string;
  operator: string;
  startedAt: string;
  status: BuildRunStatus;
  triggerId: string;
  triggerType: BuildTriggerType;
  version: string;
};

export type BuildArtifactTreeNode = {
  children?: BuildArtifactTreeNode[];
  contentType?: string;
  name: string;
  objectKey?: string;
  path: string;
  sha256?: string;
  sizeBytes: number;
  type: "directory" | "file";
};

export type BuildArtifactTree = {
  fileCount: number;
  nodes: BuildArtifactTreeNode[];
  totalSizeBytes: number;
};

export type BuildRecordDetail = BuildRunRecord & {
  artifactTree: BuildArtifactTree;
  artifactUrl: string;
  createdAt: string;
  defaultBranch: string;
  environment: string;
  environmentName: string;
  errorMessage: string;
  fileCount: number;
  finishedAt: string;
  manifestKey: string;
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
  totalSizeBytes: number;
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

export type BuildCreateFormState = {
  branch: string;
  environment: string;
  moduleId: string;
};

export type BuildCreateInput = BuildCreateFormState;

export type BuildCreateResult = {
  createdAt: string;
  id: string;
};
