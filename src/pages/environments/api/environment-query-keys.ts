export const environmentsSnapshotQueryKey = ["environments"] as const;

export const environmentStorageOptionsQueryKey = (scope: string | undefined) =>
  ["environments", "storage-options", scope] as const;

export const environmentEditQueryKey = (environmentId: string | undefined) =>
  ["environments", "edit", environmentId] as const;
