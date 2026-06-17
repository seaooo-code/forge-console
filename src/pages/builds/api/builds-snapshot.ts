import type {
  BuildReleaseFormState,
  BuildRunRecord,
  BuildRunStatus,
  BuildsSnapshot,
  BuildTriggerType,
} from "../types";

export const buildsSnapshotQueryKey = ["builds-snapshot"] as const;

type BuildRecordAPIStatus = "failed" | "pending" | "running" | "succeeded";
type BuildRecordAPITriggerType = BuildTriggerType;

type BuildRecordAPIRecord = {
  applicationName: string;
  artifactKey: string;
  artifactUrl: string;
  branch: string;
  createdAt: string;
  environment: string;
  environmentName: string;
  errorMessage: string;
  finishedAt: string;
  id: string;
  moduleId: string;
  moduleName: string;
  queuedAt: string;
  repositoryFullName: string;
  startedAt: string;
  status: BuildRecordAPIStatus;
  triggerId: string;
  triggerType: BuildRecordAPITriggerType;
  updatedAt: string;
  workerId: string;
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

type CreateBuildReleaseInput = BuildReleaseFormState & {
  buildRecordId: string;
  createdByUserId: string;
};

type ReleaseDetailAPIResponse = {
  release: {
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

  return payload.release.id;
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
  "environment not found": "环境不存在",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid release request": "发布参数无效，请确认构建状态、发布类型和标识",
  "module not found": "模块不存在",
  "release route not found": "发布路由不存在",
  "release service unavailable": "发布服务暂不可用",
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
    duration: formatDuration(record.startedAt, record.finishedAt),
    id: record.id,
    module: record.moduleName || record.moduleId,
    operator: record.workerId || "-",
    startedAt: formatTime(record.startedAt || record.queuedAt || record.createdAt),
    status: buildStatusMap[record.status],
    triggerId: record.triggerId || "-",
    triggerType: record.triggerType,
    version: record.environmentName || record.environment,
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
