import type { StorageConfigRecord, StorageSnapshot } from "@/types/storage";
import type { StorageMutationInput, StorageTestResult } from "../types";

export { storageEditQueryKey, storageSnapshotQueryKey } from "./storage-query-keys";

type StorageConfigurationAPIResponse = {
  configuration: StorageConfigRecord;
};

type APIErrorPayload = {
  error?: string;
};

export class StorageAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(getStorageAPIErrorMessage(path, status, payload));
    this.name = "StorageAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const storageAPIErrorMessages: Record<string, string> = {
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid storage configuration request": "存储配置参数无效，请检查表单",
  "storage configuration already exists": "存储配置已存在，请更换标识后重试",
  "storage configuration is referenced by environments": "存储配置已被环境引用，不能删除",
  "storage configuration not found": "存储配置不存在",
  "storage service unavailable": "存储服务暂不可用",
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

export async function fetchStorageDetailSnapshot(storageId: string): Promise<StorageSnapshot> {
  const payload = await fetchJSON<StorageConfigurationAPIResponse>(
    `/api/v1/storage/configurations/${encodeURIComponent(storageId)}`,
  );

  return {
    configurations: [payload.configuration],
    pagination: {
      page: 1,
      pageSize: 1,
      total: 1,
    },
  };
}

export async function createStorageConfiguration(
  input: StorageMutationInput,
): Promise<StorageConfigRecord> {
  const payload = await fetchJSON<StorageConfigurationAPIResponse>(
    "/api/v1/storage/configurations",
    {
      body: JSON.stringify(input),
      method: "POST",
    },
  );

  return payload.configuration;
}

export async function testStorageConfiguration(
  input: StorageMutationInput,
  storageId?: string,
): Promise<StorageTestResult> {
  return fetchJSON<StorageTestResult>("/api/v1/storage/configurations/test", {
    body: JSON.stringify(storageId ? { ...input, id: storageId } : input),
    method: "POST",
  });
}

export async function updateStorageConfiguration(
  storageId: string,
  input: StorageMutationInput,
): Promise<StorageConfigRecord> {
  const payload = await fetchJSON<StorageConfigurationAPIResponse>(
    `/api/v1/storage/configurations/${encodeURIComponent(storageId)}`,
    {
      body: JSON.stringify(input),
      method: "PATCH",
    },
  );

  return payload.configuration;
}

export async function deleteStorageConfiguration(storageId: string): Promise<StorageConfigRecord> {
  const payload = await fetchJSON<StorageConfigurationAPIResponse>(
    `/api/v1/storage/configurations/${encodeURIComponent(storageId)}`,
    {
      method: "DELETE",
    },
  );

  return payload.configuration;
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
    throw new StorageAPIError(path, response.status, payload);
  }

  return response.json() as Promise<T>;
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

function getStorageAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  const error = payload?.error;
  if (error) {
    return storageAPIErrorMessages[error] ?? error;
  }
  return `Request ${path} failed with ${status}`;
}
