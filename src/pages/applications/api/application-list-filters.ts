import type { ApplicationListFilters } from "../types";

export const emptyApplicationListFilters: ApplicationListFilters = {
  keyword: "",
  owner: "",
  platform: "",
  status: "",
};

export const applicationsSnapshotQueryKey = (filters?: Partial<ApplicationListFilters>) => {
  const normalizedFilters = normalizeApplicationListFilters(filters);

  if (!hasApplicationListFilters(normalizedFilters)) {
    return ["applications-snapshot"] as const;
  }

  return ["applications-snapshot", normalizedFilters] as const;
};

export function normalizeApplicationListFilters(
  filters?: Partial<ApplicationListFilters>,
): ApplicationListFilters {
  return {
    keyword: filters?.keyword?.trim() ?? "",
    owner: filters?.owner?.trim() ?? "",
    platform: filters?.platform?.trim() ?? "",
    status: filters?.status ?? "",
  };
}

function hasApplicationListFilters(filters: ApplicationListFilters) {
  return Boolean(filters.platform || filters.status || filters.owner || filters.keyword);
}
