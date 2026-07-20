import { fetchAllPaginatedItems, normalizePagination } from "@/api/pagination";

import type {
  ReleaseGrayStrategy,
  ReleasePointerRecord,
  ReleaseRecordDetail,
  ReleaseRecordStatus,
  ReleaseRecordsFilters,
  ReleaseRecordsRequest,
  ReleaseRecordsSnapshot,
  ReleaseRecordType,
} from "../types";

export const releaseRecordDetailQueryKey = (releaseId: string) =>
  ["release-record-detail", releaseId] as const;
export const releaseRecordsSnapshotQueryKey = ["release-records-snapshot"] as const;
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

type ReleaseRecordAPIStatus = ReleaseRecordStatus;
type ReleaseRecordAPIType = ReleaseRecordType;

type ReleaseRecordAPIRecord = {
  applicationName: string;
  artifactKey: string;
  artifactUrl: string;
  buildRecordId: string;
  createdAt: string;
  createdBy: string;
  createdByUserId: string;
  description: string;
  environment: string;
  environmentName: string;
  expiresAt: string;
  grayPercentage: number;
  grayStrategy: ReleaseGrayStrategy;
  id: string;
  identifier: string;
  moduleId: string;
  moduleName: string;
  releaseType: ReleaseRecordAPIType;
  status: ReleaseRecordAPIStatus;
  updatedAt: string;
};

type ReleaseRecordsAPIResponse = {
  pagination: ReleaseRecordsSnapshot["pagination"];
  releases: ReleaseRecordAPIRecord[];
  summary: ReleaseRecordsSnapshot["summary"];
};

type ReleaseDetailAPIResponse = {
  release: ReleaseRecordAPIRecord;
};

type APIErrorPayload = {
  error?: string;
};

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

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
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
      body: JSON.stringify({ grayPercentage }),
      method: "PATCH",
    },
  );

  return normalizeReleaseRecord(payload.release);
}

export async function inactivateTargetedGrayRelease(
  releaseId: string,
): Promise<ReleaseRecordDetail> {
  const normalizedReleaseId = releaseId.trim();
  if (!normalizedReleaseId) {
    throw new ReleaseRecordsAPIError("/api/v1/releases", 400, {
      error: "invalid release request",
    });
  }

  const payload = await fetchJSON<ReleaseDetailAPIResponse>(
    `/api/v1/releases/${encodeURIComponent(normalizedReleaseId)}/inactivate`,
    {
      method: "PATCH",
    },
  );

  return normalizeReleaseRecord(payload.release);
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
    throw new ReleaseRecordsAPIError(path, response.status, payload);
  }

  return response.json() as Promise<T>;
}

const releaseRecordsAPIErrorMessages: Record<string, string> = {
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid release request": "发布参数无效，请确认灰度配置",
  "release already active": "该构建已是当前发布目标的生效版本，没有新的路由变化",
  "release not found": "发布记录不存在",
  "release service unavailable": "发布服务暂不可用",
};

function getReleaseRecordsAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  const error = payload?.error;
  if (error && releaseRecordsAPIErrorMessages[error]) {
    return releaseRecordsAPIErrorMessages[error];
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

function normalizeReleaseRecord(record: ReleaseRecordAPIRecord): ReleasePointerRecord {
  return {
    application: record.applicationName || "-",
    artifact: record.artifactKey || record.artifactUrl || "-",
    artifactKey: record.artifactKey || "-",
    artifactUrl: record.artifactUrl || "",
    buildRecordId: record.buildRecordId || "-",
    createdAt: formatRecordNumber(record.createdAt),
    createdAtRaw: record.createdAt,
    createdAtShort: formatShortRecordTime(record.createdAt),
    createdByUserId: record.createdByUserId || "-",
    description: record.description || "",
    environment: record.environment || "-",
    environmentName: record.environmentName || record.environment || "-",
    expiresAt: formatRecordNumber(record.expiresAt),
    expiresAtRaw: record.expiresAt || "",
    expiresAtShort: formatShortRecordTime(record.expiresAt),
    grayPercentage: record.grayPercentage ?? 0,
    grayStrategy: record.grayStrategy || "",
    id: record.id,
    identifier: record.identifier || "",
    module: record.moduleName || "-",
    moduleId: record.moduleId || "-",
    operator: record.createdBy || record.createdByUserId || "-",
    releaseType: record.releaseType,
    status: record.status,
    updatedAt: formatShortRecordTime(record.updatedAt),
    updatedAtFull: formatRecordNumber(record.updatedAt),
    updatedAtRaw: record.updatedAt,
  };
}

function formatShortRecordTime(value: string) {
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
