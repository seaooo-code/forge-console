import type { PaginationParams } from "@/types/pagination";

export const storageSnapshotQueryKey = ["storage-snapshot"] as const;

export const storagePageQueryKey = (pagination: PaginationParams) => [
  ...storageSnapshotQueryKey,
  pagination,
];

export const storageEditQueryKey = (storageId: string | undefined) =>
  ["storage-snapshot", "edit", storageId] as const;
