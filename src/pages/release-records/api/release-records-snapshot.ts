import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";
import { fetchAllPaginatedItems, normalizePagination } from "@/api/pagination";
import { describeReleaseCapabilityConflict } from "@/api/releases";

import type {
  ReleaseEvent,
  ReleasePointerRecord,
  ReleasePullStats,
  ReleaseRecordDetail,
  ReleaseRecordsFilters,
  ReleaseRecordsRequest,
  ReleaseRecordsSnapshot,
} from "../types";

export const releaseRecordDetailQueryKey = (releaseId: string) =>
  ["release-record-detail", releaseId] as const;
export const releaseRecordsSnapshotQueryKey = ["release-records-snapshot"] as const;
export const releaseEventsQueryKey = (releaseId: string) => ["release-events", releaseId] as const;
export const releasePullStatsQueryKey = (buildRecordId: string, environment: string) =>
  ["release-pull-stats", buildRecordId, environment] as const;
export const releaseRecordsSnapshotQueryKeyWithFilters = (
  filters?: Partial<ReleaseRecordsRequest>,
) => {
  if (!filters) {
    return releaseRecordsSnapshotQueryKey;
  }

  return [...releaseRecordsSnapshotQueryKey, normalizeReleaseRecordsFilters(filters)] as const;
};

export const releaseRecordsAllQueryKey = (filters?: Partial<ReleaseRecordsFilters>) => [
  ...releaseRecordsSnapshotQueryKey,
  "all",
  normalizeReleaseRecordsFilters(filters),
];

type ReleaseRecordAPIRecord = APISchemas["ReleaseRecord"];

type ReleaseRecordsAPIResponse = APISchemas["ReleasesResponse"];

type ReleaseDetailAPIResponse = APISchemas["ReleaseDetailResponse"];

type ReleaseGrayPercentageAPIPayload = APISchemas["ReleaseGrayPercentageUpdateRequest"];

export class ReleaseRecordsAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(getReleaseRecordsAPIErrorMessage(path, status, payload));
    this.name = "ReleaseRecordsAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new ReleaseRecordsAPIError(path, status, payload),
);

export async function fetchReleaseRecordsSnapshot(
  filters: Partial<ReleaseRecordsRequest> = {},
): Promise<ReleaseRecordsSnapshot> {
  const normalizedFilters = normalizeReleaseRecordsFilters(filters);
  const searchParams = new URLSearchParams();

  searchParams.set("page", String(normalizedFilters.page));
  searchParams.set("pageSize", String(normalizedFilters.pageSize));

  if (normalizedFilters.applicationId) {
    searchParams.set("applicationId", normalizedFilters.applicationId);
  }
  if (normalizedFilters.moduleId) {
    searchParams.set("moduleId", normalizedFilters.moduleId);
  }
  if (normalizedFilters.environment) {
    searchParams.set("environment", normalizedFilters.environment);
  }
  if (normalizedFilters.status) {
    searchParams.set("status", normalizedFilters.status);
  }
  if (normalizedFilters.releaseType) {
    searchParams.set("releaseType", normalizedFilters.releaseType);
  }

  const queryString = searchParams.toString();
  const payload = await fetchJSON<ReleaseRecordsAPIResponse>(
    `/api/v1/releases${queryString ? `?${queryString}` : ""}`,
  );
  const records = payload.releases.map(normalizeReleaseRecord);

  return {
    pagination: payload.pagination,
    records,
    summary: payload.summary,
  };
}

export async function fetchAllReleaseRecordsSnapshot(
  filters?: Partial<ReleaseRecordsFilters>,
): Promise<ReleaseRecordsSnapshot> {
  const { items, snapshot } = await fetchAllPaginatedItems(
    (pagination) => fetchReleaseRecordsSnapshot({ ...filters, ...pagination }),
    (pageSnapshot) => pageSnapshot.records,
  );

  return {
    ...snapshot,
    records: items,
  };
}

function normalizeReleaseRecordsFilters(
  filters?: Partial<ReleaseRecordsRequest>,
): ReleaseRecordsRequest {
  return {
    applicationId: filters?.applicationId?.trim() ?? "",
    environment: filters?.environment?.trim() ?? "",
    moduleId: filters?.moduleId?.trim() ?? "",
    ...normalizePagination(filters),
    releaseType: filters?.releaseType ?? "",
    status: filters?.status ?? "",
  };
}

export async function fetchReleaseRecordDetail(releaseId: string): Promise<ReleaseRecordDetail> {
  const normalizedReleaseId = releaseId.trim();
  if (!normalizedReleaseId) {
    throw new ReleaseRecordsAPIError("/api/v1/releases", 400, {
      error: "invalid release request",
    });
  }

  const snapshot = await fetchAllReleaseRecordsSnapshot();
  const record = snapshot.records.find((item) => item.id === normalizedReleaseId);
  if (!record) {
    throw new ReleaseRecordsAPIError(`/api/v1/releases/${encodeURIComponent(releaseId)}`, 404, {
      error: "release not found",
    });
  }

  return record;
}

export async function updateReleaseGrayPercentage(
  releaseId: string,
  grayPercentage: number,
): Promise<ReleaseRecordDetail> {
  const normalizedReleaseId = releaseId.trim();
  if (!normalizedReleaseId) {
    throw new ReleaseRecordsAPIError("/api/v1/releases", 400, {
      error: "invalid release request",
    });
  }

  const payload = await fetchJSON<ReleaseDetailAPIResponse>(
    `/api/v1/releases/${encodeURIComponent(normalizedReleaseId)}/gray-percentage`,
    {
      body: JSON.stringify({ grayPercentage } satisfies ReleaseGrayPercentageAPIPayload),
      method: "PATCH",
    },
  );

  return normalizeReleaseRecord(payload.release);
}

export async function deactivateRelease(
  releaseId: string,
  reason: string,
): Promise<ReleaseRecordDetail> {
  const payload = await fetchJSON<ReleaseDetailAPIResponse>(
    `/api/v1/releases/${encodeURIComponent(releaseId)}/deactivate`,
    {
      body: JSON.stringify({ reason } satisfies APISchemas["ReleaseDeactivateRequest"]),
      method: "POST",
    },
  );
  return normalizeReleaseRecord(payload.release);
}

/** 回滚会创建一条新的全量发布，返回新发布。 */
export async function rollbackRelease(
  releaseId: string,
  description: string,
): Promise<ReleaseRecordDetail> {
  const payload = await fetchJSON<ReleaseDetailAPIResponse>(
    `/api/v1/releases/${encodeURIComponent(releaseId)}/rollback`,
    {
      body: JSON.stringify({ description } satisfies APISchemas["ReleaseRollbackRequest"]),
      method: "POST",
    },
  );
  return normalizeReleaseRecord(payload.release);
}

export async function fetchReleaseEvents(releaseId: string): Promise<ReleaseEvent[]> {
  const payload = await fetchJSON<APISchemas["ReleaseEventsResponse"]>(
    `/api/v1/releases/${encodeURIComponent(releaseId)}/events`,
  );
  return payload.events.map((event) => ({
    actor: event.actor?.name || "系统",
    createdAt: formatRecordNumber(event.createdAt),
    detail: event.detail,
    id: event.id,
    kind: event.kind,
  }));
}

/** 这条发布对应构建在该环境下最近 7 天的拉包次数，按天汇总。 */
export async function fetchReleasePullStats(
  buildRecordId: string,
  environment: string,
): Promise<ReleasePullStats> {
  const searchParams = new URLSearchParams({ buildRecordId, days: "7", environment });
  const payload = await fetchJSON<APISchemas["ArtifactPullStatsResponse"]>(
    `/api/v1/artifact-pull-stats?${searchParams.toString()}`,
  );
  const byDay = new Map<string, { platforms: Record<string, number>; total: number }>();
  for (const stat of payload.stats) {
    const day = byDay.get(stat.day) ?? { platforms: {}, total: 0 };
    day.total += stat.requests;
    day.platforms[stat.platform] = (day.platforms[stat.platform] ?? 0) + stat.requests;
    byDay.set(stat.day, day);
  }
  const days = [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, value]) => ({ day, ...value }));
  return { days, total: days.reduce((sum, day) => sum + day.total, 0) };
}

const releaseRecordsAPIErrorMessages: Record<string, string> = {
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid release request": "发布参数无效，请确认灰度配置",
  "release already active": "该构建已是当前发布目标的生效版本，没有新的路由变化",
  "release not active": "这条发布已经失效，请刷新后再试",
  "release not found": "发布记录不存在",
  "release rollback unavailable": "没有可以回滚的上一次全量发布",
  "release service unavailable": "发布服务暂不可用",
};

function getReleaseRecordsAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  const capabilityConflict = describeReleaseCapabilityConflict(payload);
  if (capabilityConflict) {
    return capabilityConflict;
  }
  const error = payload?.error;
  if (error && releaseRecordsAPIErrorMessages[error]) {
    return releaseRecordsAPIErrorMessages[error];
  }
  return error ?? `Request ${path} failed with ${status}`;
}

function normalizeReleaseRecord(record: ReleaseRecordAPIRecord): ReleasePointerRecord {
  return {
    application: record.applicationName || "-",
    artifact: record.artifactKey || record.artifactUrl || "-",
    artifactKey: record.artifactKey || "-",
    artifactUrl: record.artifactUrl || "",
    buildRecordId: record.buildRecordId || "-",
    channel: record.channel ?? "",
    createdAt: formatRecordNumber(record.createdAt),
    createdAtRaw: record.createdAt,
    createdAtShort: formatShortRecordTime(record.createdAt),
    createdByUserId: record.createdByUserId || "-",
    description: record.description || "",
    environment: record.environment || "-",
    environmentName: record.environmentName || record.environment || "-",
    expiresAt: formatRecordNumber(record.expiresAt),
    grayPercentage: record.grayPercentage ?? 0,
    grayStrategy: record.grayStrategy || "",
    id: record.id,
    module: record.moduleName || "-",
    moduleId: record.moduleId || "-",
    operator: record.createdBy || record.createdByUserId || "-",
    releaseType: record.releaseType,
    runtimeVersion: record.runtimeVersion || "",
    status: record.status,
    updatedAt: formatShortRecordTime(record.updatedAt),
    updatedAtFull: formatRecordNumber(record.updatedAt),
    updatedAtRaw: record.updatedAt,
  };
}

function formatShortRecordTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${month}-${day} ${hour}:${minute}`;
}

function formatRecordNumber(value?: string) {
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
