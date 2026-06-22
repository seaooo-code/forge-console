import type {
  ReleasePointerRecord,
  ReleaseRecordDetail,
  ReleaseRecordStatus,
  ReleaseRecordsFilters,
  ReleaseRecordsSnapshot,
  ReleaseRecordType,
} from "../types";

export const releaseRecordDetailQueryKey = (releaseId: string) =>
  ["release-record-detail", releaseId] as const;
export const releaseRecordsSnapshotQueryKey = ["release-records-snapshot"] as const;
export const releaseRecordsSnapshotQueryKeyWithFilters = (filters: ReleaseRecordsFilters) =>
  [...releaseRecordsSnapshotQueryKey, filters] as const;

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
  id: string;
  identifier: string;
  moduleId: string;
  moduleName: string;
  releaseType: ReleaseRecordAPIType;
  status: ReleaseRecordAPIStatus;
  updatedAt: string;
};

type ReleaseRecordsAPIResponse = {
  releases: ReleaseRecordAPIRecord[];
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
  filters: ReleaseRecordsFilters = {},
): Promise<ReleaseRecordsSnapshot> {
  const searchParams = new URLSearchParams();
  const moduleId = filters.moduleId?.trim();
  const environment = filters.environment?.trim();

  if (moduleId) {
    searchParams.set("moduleId", moduleId);
  }
  if (environment) {
    searchParams.set("environment", environment);
  }

  const queryString = searchParams.toString();
  const payload = await fetchJSON<ReleaseRecordsAPIResponse>(
    `/api/v1/releases${queryString ? `?${queryString}` : ""}`,
  );
  const records = payload.releases.map(normalizeReleaseRecord);
  const summary: ReleaseRecordsSnapshot["summary"] = {
    active: 0,
    inactive: 0,
    revoked: 0,
    total: records.length,
  };
  for (const record of records) {
    summary[record.status] += 1;
  }

  return {
    records,
    summary,
  };
}

export async function fetchReleaseRecordDetail(releaseId: string): Promise<ReleaseRecordDetail> {
  const normalizedReleaseId = releaseId.trim();
  if (!normalizedReleaseId) {
    throw new ReleaseRecordsAPIError("/api/v1/releases", 400, {
      error: "invalid release request",
    });
  }

  const snapshot = await fetchReleaseRecordsSnapshot();
  const record = snapshot.records.find((item) => item.id === normalizedReleaseId);
  if (!record) {
    throw new ReleaseRecordsAPIError(`/api/v1/releases/${encodeURIComponent(releaseId)}`, 404, {
      error: "release not found",
    });
  }

  return record;
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
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid release request": "发布记录筛选参数无效",
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
    createdByUserId: record.createdByUserId || "-",
    description: record.description || "",
    environment: record.environment || "-",
    environmentName: record.environmentName || record.environment || "-",
    id: record.id,
    identifier: record.identifier || "",
    module: record.moduleName || record.moduleId || "-",
    moduleId: record.moduleId || "-",
    operator: record.createdBy || record.createdByUserId || "-",
    releaseType: record.releaseType,
    status: record.status,
    updatedAt: formatTime(record.updatedAt),
    updatedAtFull: formatRecordNumber(record.updatedAt),
    updatedAtRaw: record.updatedAt,
  };
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
