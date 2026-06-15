export const storageSnapshotQueryKey = ["storage-snapshot"] as const;

export const storageEditQueryKey = (storageId: string) =>
  ["storage-snapshot", "edit", storageId] as const;
