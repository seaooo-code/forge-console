import type { APISchemas } from "@/api/client";
import type {
  BuildCreateFormState as SharedBuildCreateFormState,
  BuildCreateInput as SharedBuildCreateInput,
  BuildCreateResult as SharedBuildCreateResult,
  BuildListFilters as SharedBuildListFilters,
  BuildPlatform as SharedBuildPlatform,
  BuildRunRecord as SharedBuildRunRecord,
  BuildRunStatus as SharedBuildRunStatus,
  BuildsSnapshot as SharedBuildsSnapshot,
  BuildTriggerType as SharedBuildTriggerType,
} from "@/types/builds";
import type {
  BuildReleaseFormState as SharedBuildReleaseFormState,
  BuildReleaseType as SharedBuildReleaseType,
} from "@/types/releases";

export type BuildRunStatus = SharedBuildRunStatus;

export type BuildPlatform = SharedBuildPlatform;

export type BuildTriggerType = SharedBuildTriggerType;

export type BuildReleaseType = SharedBuildReleaseType;

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
  codeSourceConnectionId: string;
  createdAt: string;
  defaultBranch: string;
  /** 构建时注入到 .forge/deps/ 的依赖构建，Feature 模块为所属 Common 模块的生效默认发布；没有注入时为空数组。 */
  dependencyBuilds: APISchemas["BuildDependency"][];
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
  repositoryProvider: APISchemas["BuildRecord"]["repositoryProvider"];
  startedAtFull: string;
  startedAtRaw: string;
  storageConfigurationId: string;
  storageConfigurationName: string;
  totalSizeBytes: number;
  updatedAt: string;
  workerId: string;
};

export type BuildsSnapshot = SharedBuildsSnapshot;

/** 构建日志在前端累积后的状态：已拼接的内容、最后读到的 seq 和是否已读完。 */
export type BuildLogState = {
  content: string;
  finished: boolean;
  /** 尚未读到任何分片时为 undefined，请求时不带 afterSeq。 */
  lastSeq?: number;
};

export type ActiveFullReleaseTarget = {
  build?: BuildRunRecord;
  buildId: string;
};

export type BuildModuleOption = {
  applicationName: string;
  defaultBranch: string;
  label: string;
  repositoryFullName: string;
  value: string;
};

export type BuildEnvironmentOption = {
  label: string;
  value: string;
};

export type BuildReleaseFormState = SharedBuildReleaseFormState;

export type BuildCreateFormState = SharedBuildCreateFormState;

export type BuildCreateInput = SharedBuildCreateInput;

export type BuildCreateResult = SharedBuildCreateResult;
