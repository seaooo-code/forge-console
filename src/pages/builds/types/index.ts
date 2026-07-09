import type {
  BuildCreateFormState as SharedBuildCreateFormState,
  BuildCreateInput as SharedBuildCreateInput,
  BuildCreateResult as SharedBuildCreateResult,
  BuildListFilters as SharedBuildListFilters,
  BuildRunRecord as SharedBuildRunRecord,
  BuildRunStatus as SharedBuildRunStatus,
  BuildsSnapshot as SharedBuildsSnapshot,
  BuildTriggerType as SharedBuildTriggerType,
} from "@/types/builds";
import type {
  BuildReleaseFormState as SharedBuildReleaseFormState,
  BuildReleaseGrayStrategy as SharedBuildReleaseGrayStrategy,
  BuildReleaseType as SharedBuildReleaseType,
} from "@/types/releases";

export type BuildRunStatus = SharedBuildRunStatus;

export type BuildTriggerType = SharedBuildTriggerType;

export type BuildReleaseType = SharedBuildReleaseType;

export type BuildReleaseGrayStrategy = SharedBuildReleaseGrayStrategy;

export type BuildRunRecord = SharedBuildRunRecord;

export type BuildListFilters = SharedBuildListFilters;

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

export type BuildsSnapshot = SharedBuildsSnapshot;

export type BuildReleaseFormState = SharedBuildReleaseFormState;

export type BuildCreateFormState = SharedBuildCreateFormState;

export type BuildCreateInput = SharedBuildCreateInput;

export type BuildCreateResult = SharedBuildCreateResult;
