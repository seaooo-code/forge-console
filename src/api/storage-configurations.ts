import { fetchAllPaginatedItems, normalizePagination } from "@/api/pagination";
import type { PaginationParams } from "@/types/pagination";
import type { StorageConfigRecord, StorageSnapshot } from "@/types/storage";

type StorageConfigurationsAPIResponse = {
  configurations: StorageConfigRecord[];
  pagination: StorageSnapshot["pagination"];
};

type APIErrorPayload = {
  error?: string;
};

export class StorageConfigurationsAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(payload?.error || `Request ${path} failed with ${status}`);
    this.name = "StorageConfigurationsAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

export async function fetchStorageConfigurationsSnapshot(
  pagination?: Partial<PaginationParams>,
): Promise<StorageSnapshot> {
  const normalizedPagination = normalizePagination(pagination);
  const searchParams = new URLSearchParams({
    page: String(normalizedPagination.page),
    pageSize: String(normalizedPagination.pageSize),
  });
  const payload = await fetchJSON<StorageConfigurationsAPIResponse>(
    `/api/v1/storage/configurations?${searchParams.toString()}`,
  );

  return {
    configurations: payload.configurations,
    pagination: payload.pagination,
  };
}

export async function fetchAllStorageConfigurationsSnapshot(): Promise<StorageSnapshot> {
  const { items, snapshot } = await fetchAllPaginatedItems(
    fetchStorageConfigurationsSnapshot,
    (pageSnapshot) => pageSnapshot.configurations,
  );

  return {
    ...snapshot,
    configurations: items,
  };
}

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw new StorageConfigurationsAPIError(path, response.status, payload);
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
