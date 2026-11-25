import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";
import { fetchAllPaginatedItems, normalizePagination } from "@/api/pagination";
import type {
  BuildCreateInput,
  BuildCreateResult,
  BuildListFilters,
  BuildListRequest,
  BuildRunRecord,
  BuildRunStatus,
  BuildsSnapshot,
} from "@/types/builds";
import { toCommitDetail } from "@/utils";

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

type BuildRecordAPIRecord = APISchemas["BuildRecord"];

type BuildRecordAPIStatus = BuildRecordAPIRecord["status"];

type BuildsAPIResponse = APISchemas["BuildRecordsResponse"];

type BuildDetailAPIResponse = APISchemas["BuildRecordDetailResponse"];

type BuildCreateAPIPayload = APISchemas["BuildRecordCreateRequest"];

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
    // 控制台只能创建手动构建；分支留空时由后端回退到模块默认分支。
    body: JSON.stringify({
      branch: input.branch.trim() || undefined,
      environment: input.environment,
      moduleId: input.moduleId,
    } satisfies BuildCreateAPIPayload),
    method: "POST",
  });

  return {
    createdAt: formatRecordNumber(payload.build.createdAt),
    id: payload.build.id,
    number: payload.build.number,
  };
}

const buildAPIErrorMessages: Record<string, string> = {
  "build adapter is disabled": "模块使用的构建适配器已停用，无法发起新构建",
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

/** 构建列表和详情共用的记录转换，详情页在此基础上补充产物树等字段。 */
export function normalizeBuildRecord(record: BuildRecordAPIRecord): BuildRunRecord {
  const commitSha = record.commitSha.trim();
  const repositoryWebUrl = record.repositoryWebUrl?.trim().replace(/\/+$/, "") ?? "";

  return {
    application: record.applicationName || "-",
    artifact: record.artifactKey || "-",
    branch: record.branch || "-",
    buildAdapterId: record.buildAdapterId?.trim() ?? "",
    buildAdapterVersion: record.buildAdapterVersion ?? null,
    commit: toCommitDetail({
      authorName: record.commitAuthorName,
      committedAt: record.committedAt,
      repositoryWebUrl,
      sha: commitSha,
      title: record.commitTitle,
    }),
    commitSha,
    createdAt: formatRecordNumber(record.createdAt),
    createdAtRaw: record.createdAt,
    defaultBranch: record.defaultBranch?.trim() ?? "",
    createdBy: record.createdBy,
    duration: formatDuration(record.startedAt ?? "", record.finishedAt ?? ""),
    environment: record.environment,
    id: record.id,
    module: record.moduleName || record.moduleId,
    moduleId: record.moduleId,
    number: record.number,
    operator: record.workerId || "-",
    platforms: record.platforms ?? [],
    ciPipelineUrl: record.ciPipelineUrl?.trim() ?? "",
    renderedDockerfileSha256: record.renderedDockerfileSha256?.trim() ?? "",
    repositoryWebUrl,
    runtimeVersion: record.runtimeVersion.trim(),
    signingKeyId: record.signingKeyId ?? "",
    providedCapabilities: Object.entries(record.providedCapabilities ?? {})
      .map(([name, level]) => `${name} ${level}`)
      .join("，"),
    requiredCapabilities: Object.entries(record.requiredCapabilities ?? {})
      .map(([name, level]) => `${name} ≥ ${level}`)
      .join("，"),
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
