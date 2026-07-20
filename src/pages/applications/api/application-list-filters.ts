import { normalizePagination } from "@/api/pagination";

import type { ApplicationListRequest } from "../types";

export const applicationsRootQueryKey = ["applications-snapshot"] as const;

export const applicationsAllQueryKey = [...applicationsRootQueryKey, "all"] as const;

export const applicationOptionsQueryKey = [...applicationsRootQueryKey, "options"] as const;

export const applicationsSnapshotQueryKey = (filters?: Partial<ApplicationListRequest>) => {
  if (!filters) {
    return applicationsRootQueryKey;
  }

  return [...applicationsRootQueryKey, normalizeApplicationListFilters(filters)] as const;
};

export const applicationDetailQueryKey = (applicationSlug: string | undefined) =>
  [...applicationsRootQueryKey, "detail", applicationSlug] as const;

export const applicationEditQueryKey = (applicationSlug: string | undefined) =>
  [...applicationsRootQueryKey, "edit", applicationSlug] as const;

export const applicationDeleteCheckQueryKey = (applicationSlug: string | undefined) =>
  [...applicationsRootQueryKey, "delete-check", applicationSlug] as const;

export function normalizeApplicationListFilters(
  filters?: Partial<ApplicationListRequest>,
): ApplicationListRequest {
  return {
    keyword: filters?.keyword?.trim() ?? "",
    owner: filters?.owner?.trim() ?? "",
    ...normalizePagination(filters),
    platform: filters?.platform?.trim() ?? "",
    status: filters?.status ?? "",
  };
}
