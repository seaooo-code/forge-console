export const storageSnapshotQueryKey = ["storage-snapshot"] as const;

export const storageEditQueryKey = (storageId: string | undefined) =>
  ["storage-snapshot", "edit", storageId] as const;
