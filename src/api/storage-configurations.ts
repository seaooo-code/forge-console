import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";
import { fetchAllPaginatedItems, normalizePagination } from "@/api/pagination";
import type { PaginationParams } from "@/types/pagination";
import type { StorageSnapshot } from "@/types/storage";

type StorageConfigurationsAPIResponse = APISchemas["StorageConfigurationsResponse"];

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

const fetchJSON = createFetchClient(
  (path, status, payload) => new StorageConfigurationsAPIError(path, status, payload),
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
