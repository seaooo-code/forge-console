import type {
  BuildArtifactTree,
  BuildArtifactTreeNode,
  BuildCreateInput,
  BuildCreateResult,
  BuildRecordDetail,
  BuildReleaseFormState,
  BuildRunRecord,
  BuildRunStatus,
  BuildsSnapshot,
  BuildTriggerType,
} from "../types";

export const buildDetailQueryKey = (buildId: string) => ["build-detail", buildId] as const;
export const buildsSnapshotQueryKey = ["builds-snapshot"] as const;

type BuildRecordAPIStatus = "failed" | "pending" | "running" | "succeeded";
type BuildRecordAPITriggerType = BuildTriggerType;

type BuildRecordAPIRecord = {
  applicationName: string;
  artifactTree?: BuildArtifactTreeAPIRecord;
  artifactKey: string;
  artifactUrl: string;
  branch: string;
  createdAt: string;
  defaultBranch: string;
  environment: string;
  environmentName: string;
  errorMessage: string;
  fileCount: number;
  finishedAt: string;
  id: string;
  manifestKey: string;
  moduleId: string;
  moduleName: string;
  queuedAt: string;
  repositoryFullName: string;
  repositoryId: string;
  repositoryInstallationId: string;
  repositoryProvider: string;
  startedAt: string;
  status: BuildRecordAPIStatus;
  storageConfigurationId: string;
  storageConfigurationName: string;
  triggerId: string;
  triggerType: BuildRecordAPITriggerType;
  totalSizeBytes: number;
  updatedAt: string;
  workerId: string;
};

type BuildArtifactTreeAPIRecord = {
  fileCount: number;
  nodes: BuildArtifactTreeNodeAPIRecord[];
  totalSizeBytes: number;
};

type BuildArtifactTreeNodeAPIRecord = {
  children?: BuildArtifactTreeNodeAPIRecord[];
  contentType?: string;
  name: string;
  objectKey?: string;
  path: string;
  sha256?: string;
  sizeBytes: number;
  type: "directory" | "file";
};

type BuildsAPIResponse = {
  builds: BuildRecordAPIRecord[];
  summary: {
    failed: number;
    pending: number;
    running: number;
    succeeded: number;
    total: number;
  };
};

type BuildDetailAPIResponse = {
  build: BuildRecordAPIRecord;
};

type CreateBuildReleaseInput = BuildReleaseFormState & {
  buildRecordId: string;
  createdByUserId: string;
};

type ReleaseDetailAPIResponse = {
  release: {
    createdAt: string;
    id: string;
  };
};

type APIErrorPayload = {
  error?: string;
};

export class BuildAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(getBuildAPIErrorMessage(path, status, payload));
    this.name = "BuildAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

export async function fetchBuildsSnapshot(): Promise<BuildsSnapshot> {
  const payload = await fetchJSON<BuildsAPIResponse>("/api/v1/builds");

  return {
    builds: payload.builds.map(normalizeBuildRecord),
    summary: {
      failed: payload.summary.failed,
      queued: payload.summary.pending,
      running: payload.summary.running,
      success: payload.summary.succeeded,
      total: payload.summary.total,
    },
  };
}

export async function fetchBuildDetail(buildId: string): Promise<BuildRecordDetail> {
  const payload = await fetchJSON<BuildDetailAPIResponse>(
    `/api/v1/builds/${encodeURIComponent(buildId)}`,
  );

  return normalizeBuildDetail(payload.build);
}

export async function createBuild(input: BuildCreateInput): Promise<BuildCreateResult> {
  const payload = await fetchJSON<BuildDetailAPIResponse>("/api/v1/builds", {
    body: JSON.stringify({
      branch: input.branch.trim(),
      environment: input.environment,
      moduleId: input.moduleId,
      triggerType: "manual",
    }),
    method: "POST",
  });

  return {
    createdAt: formatRecordNumber(payload.build.createdAt),
    id: payload.build.id,
  };
}

export async function createBuildRelease(input: CreateBuildReleaseInput): Promise<string> {
  const payload = await fetchJSON<ReleaseDetailAPIResponse>("/api/v1/releases", {
    body: JSON.stringify({
      buildRecordId: input.buildRecordId,
      createdByUserId: input.createdByUserId,
      identifier: input.releaseType === "targeted" ? input.identifier.trim() : "",
      releaseType: input.releaseType,
    }),
    method: "POST",
  });

  return formatRecordNumber(payload.release.createdAt);
}

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    ...init,
    headers: init?.body
      ? {
          "Content-Type": "application/json",
          ...init.headers,
        }
      : init?.headers,
  });

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw new BuildAPIError(path, response.status, payload);
  }

  return response.json() as Promise<T>;
}

const buildAPIErrorMessages: Record<string, string> = {
  "build record not found": "构建记录不存在",
  "build service unavailable": "构建服务暂不可用",
  "environment not found": "环境不存在",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid build request": "构建参数无效，请检查模块、分支和环境",
  "invalid release request": "发布参数无效，请确认构建状态、发布类型和标识",
  "module not found": "模块不存在",
  "release route not found": "发布路由不存在",
  "release service unavailable": "发布服务暂不可用",
  "storage configuration not found": "环境未绑定有效存储配置，无法构建",
};

function getBuildAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  const error = payload?.error;
  if (error && buildAPIErrorMessages[error]) {
    return buildAPIErrorMessages[error];
  }
  return error ?? `Request ${path} failed with ${status}`;
}

async function readErrorPayload(response: Response): Promise<APIErrorPayload | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  try {
    return (await response.json()) as APIErrorPayload;
  } catch (_error) {
    return undefined;
  }
}

function normalizeBuildRecord(record: BuildRecordAPIRecord): BuildRunRecord {
  return {
    application: record.applicationName || "-",
    artifact: record.artifactKey || "-",
    branch: record.branch || "-",
    commit: "-",
    createdAt: formatRecordNumber(record.createdAt),
    createdAtRaw: record.createdAt,
    duration: formatDuration(record.startedAt, record.finishedAt),
    environment: record.environment,
    id: record.id,
    module: record.moduleName || record.moduleId,
    moduleId: record.moduleId,
    operator: record.workerId || "-",
    startedAt: formatTime(record.startedAt || record.queuedAt || record.createdAt),
    status: buildStatusMap[record.status],
    triggerId: record.triggerId || "-",
    triggerType: record.triggerType,
    version: record.environmentName || record.environment,
  };
}

function normalizeBuildDetail(record: BuildRecordAPIRecord): BuildRecordDetail {
  return {
    ...normalizeBuildRecord(record),
    artifactTree: normalizeArtifactTree(
      record.artifactTree,
      record.fileCount,
      record.totalSizeBytes,
    ),
    createdAt: formatRecordNumber(record.createdAt),
    defaultBranch: record.defaultBranch || "-",
    environment: record.environment || "-",
    environmentName: record.environmentName || record.environment || "-",
    errorMessage: record.errorMessage || "",
    artifactUrl: record.artifactUrl || "-",
    fileCount: record.fileCount ?? 0,
    finishedAt: formatFullTime(record.finishedAt),
    manifestKey: record.manifestKey || "",
    moduleId: record.moduleId,
    queuedAt: formatFullTime(record.queuedAt),
    repositoryFullName: record.repositoryFullName || "-",
    repositoryId: record.repositoryId || "-",
    repositoryInstallationId: record.repositoryInstallationId || "-",
    repositoryProvider: record.repositoryProvider || "-",
    startedAtFull: formatFullTime(record.startedAt),
    startedAtRaw: record.startedAt,
    storageConfigurationId: record.storageConfigurationId || "-",
    storageConfigurationName: record.storageConfigurationName || "-",
    totalSizeBytes: record.totalSizeBytes ?? 0,
    updatedAt: formatFullTime(record.updatedAt),
    workerId: record.workerId || "-",
  };
}

function normalizeArtifactTree(
  tree: BuildArtifactTreeAPIRecord | undefined,
  fileCount: number | undefined,
  totalSizeBytes: number | undefined,
): BuildArtifactTree {
  return {
    fileCount: tree?.fileCount ?? fileCount ?? 0,
    nodes: tree?.nodes?.map(normalizeArtifactTreeNode) ?? [],
    totalSizeBytes: tree?.totalSizeBytes ?? totalSizeBytes ?? 0,
  };
}

function normalizeArtifactTreeNode(node: BuildArtifactTreeNodeAPIRecord): BuildArtifactTreeNode {
  return {
    children: node.children?.map(normalizeArtifactTreeNode),
    contentType: node.contentType || undefined,
    name: node.name,
    objectKey: node.objectKey || undefined,
    path: node.path,
    sha256: node.sha256 || undefined,
    sizeBytes: node.sizeBytes,
    type: node.type,
  };
}

const buildStatusMap: Record<BuildRecordAPIStatus, BuildRunStatus> = {
  failed: "failed",
  pending: "queued",
  running: "running",
  succeeded: "success",
};

function formatTime(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(date);
}

function formatFullTime(value: string) {
  return formatRecordNumber(value);
}

function formatRecordNumber(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  const second = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function formatDuration(startedAt: string, finishedAt: string) {
  if (!startedAt) {
    return "-";
  }

  const start = new Date(startedAt);
  const end = finishedAt ? new Date(finishedAt) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return "-";
  }

  const totalSeconds = Math.max(1, Math.round((end.getTime() - start.getTime()) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
}
