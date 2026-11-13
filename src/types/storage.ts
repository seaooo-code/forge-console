import type { APISchemas } from "@/api/client";

import type { PaginationMeta } from "./pagination";

export type StorageConfigRecord = APISchemas["StorageConfiguration"];

export type StorageAdapter = StorageConfigRecord["adapter"];

export type StorageStatus = StorageConfigRecord["status"];

export type StorageSnapshot = {
  configurations: StorageConfigRecord[];
  pagination: PaginationMeta;
};
