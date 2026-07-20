import { type APIErrorPayload, createFetchClient } from "@/api/client";
import { fetchAllPaginatedItems, normalizePagination } from "@/api/pagination";
import type {
  BuildCreateInput,
  BuildCreateResult,
  BuildListFilters,
  BuildListRequest,
  BuildRunRecord,
  BuildRunStatus,
  BuildsSnapshot,
  BuildTriggerType,
} from "@/types/builds";

export const buildsRootQueryKey = ["builds-snapshot"] as const;

export const buildsSnapshotQueryKey = (filters?: Partial<BuildListRequest>) => {
  if (!filters) {
    return buildsRootQueryKey;
  }

  return [...buildsRootQueryKey, normalizeBuildListFilters(filters)] as const;
};

export const buildsAllQueryKey = (filters?: Partial<BuildListFilters>) => [
  ...buildsRootQueryKey,
  "all",
  normalizeBuildListFilters(filters),
];

type BuildRecordAPIStatus = "failed" | "pending" | "running" | "succeeded";
type BuildRecordAPITriggerType = BuildTriggerType;

type BuildRecordAPIRecord = {
  applicationName: string;
  artifactKey: string;
  branch: string;
  createdAt: string;
  environment: string;
  environmentName: string;
  finishedAt: string;
  id: string;
  moduleId: string;
  moduleName: string;
  queuedAt: string;
  startedAt: string;
  status: BuildRecordAPIStatus;
  triggerId: string;
  triggerType: BuildRecordAPITriggerType;
  workerId: string;
};

type BuildsAPIResponse = {
  builds: BuildRecordAPIRecord[];
  pagination: BuildsSnapshot["pagination"];
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

export class BuildsAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(getBuildsAPIErrorMessage(path, status, payload));
    this.name = "BuildsAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new BuildsAPIError(path, status, payload),
);

export async function fetchBuildsSnapshot(
  filters?: Partial<BuildListRequest>,
): Promise<BuildsSnapshot> {
  const payload = await fetchJSON<BuildsAPIResponse>(buildBuildsSnapshotPath(filters));

  return {
    builds: payload.builds.map(normalizeBuildRecord),
    pagination: payload.pagination,
    summary: {
      failed: payload.summary.failed,
      queued: payload.summary.pending,
      running: payload.summary.running,
      success: payload.summary.succeeded,
      total: payload.summary.total,
    },
  };
}

export async function fetchAllBuildsSnapshot(
  filters?: Partial<BuildListFilters>,
): Promise<BuildsSnapshot> {
  const { items, snapshot } = await fetchAllPaginatedItems(
    (pagination) => fetchBuildsSnapshot({ ...filters, ...pagination }),
    (pageSnapshot) => pageSnapshot.builds,
  );

  return {
    ...snapshot,
    builds: items,
  };
}

export function normalizeBuildListFilters(filters?: Partial<BuildListRequest>): BuildListRequest {
  return {
    applicationId: filters?.applicationId?.trim() ?? "",
    environment: filters?.environment?.trim() ?? "",
    moduleId: filters?.moduleId?.trim() ?? "",
    ...normalizePagination(filters),
    status: filters?.status ?? "",
    triggerType: filters?.triggerType ?? "",
  };
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

const buildAPIErrorMessages: Record<string, string> = {
  "build record not found": "构建记录不存在",
  "build service unavailable": "构建服务暂不可用",
  "environment not found": "环境不存在",
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid build request": "构建参数无效，请检查模块、分支和环境",
  "module not found": "模块不存在",
  "storage configuration not found": "环境未绑定有效存储配置，无法构建",
};

function getBuildsAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  const error = payload?.error;
  if (error && buildAPIErrorMessages[error]) {
    return buildAPIErrorMessages[error];
  }
  return error ?? `Request ${path} failed with ${status}`;
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

const buildStatusMap: Record<BuildRecordAPIStatus, BuildRunStatus> = {
  failed: "failed",
  pending: "queued",
  running: "running",
  succeeded: "success",
};

function buildBuildsSnapshotPath(filters?: Partial<BuildListRequest>) {
  const normalizedFilters = normalizeBuildListFilters(filters);
  const params = new URLSearchParams();

  params.set("page", String(normalizedFilters.page));
  params.set("pageSize", String(normalizedFilters.pageSize));

  if (normalizedFilters.status) {
    params.set("status", normalizedFilters.status);
  }
  if (normalizedFilters.applicationId) {
    params.set("applicationId", normalizedFilters.applicationId);
  }
  if (normalizedFilters.moduleId) {
    params.set("moduleId", normalizedFilters.moduleId);
  }
  if (normalizedFilters.environment) {
    params.set("environment", normalizedFilters.environment);
  }
  if (normalizedFilters.triggerType) {
    params.set("triggerType", normalizedFilters.triggerType);
  }

  const query = params.toString();

  return query ? `/api/v1/builds?${query}` : "/api/v1/builds";
}

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
