import type { ApplicationListFilters } from "../types";

export const applicationsRootQueryKey = ["applications-snapshot"] as const;

export const applicationOptionsQueryKey = [...applicationsRootQueryKey, "options"] as const;

export const applicationsSnapshotQueryKey = (filters?: Partial<ApplicationListFilters>) => {
  const normalizedFilters = normalizeApplicationListFilters(filters);

  if (!hasApplicationListFilters(normalizedFilters)) {
    return applicationsRootQueryKey;
  }

  return [...applicationsRootQueryKey, normalizedFilters] as const;
};

export const applicationDetailQueryKey = (applicationSlug: string | undefined) =>
  [...applicationsRootQueryKey, "detail", applicationSlug] as const;

export const applicationEditQueryKey = (applicationSlug: string | undefined) =>
  [...applicationsRootQueryKey, "edit", applicationSlug] as const;

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
