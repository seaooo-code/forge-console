import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";
import { fetchAllPaginatedItems, normalizePagination } from "@/api/pagination";
import type {
  ModuleListFilters,
  ModuleListRequest,
  ModuleRecord,
  ModulesSnapshot,
} from "@/types/modules";

export const modulesRootQueryKey = ["modules-snapshot"] as const;

export const modulesSnapshotQueryKey = (filters?: Partial<ModuleListRequest>) => {
  if (!filters) {
    return modulesRootQueryKey;
  }

  return [...modulesRootQueryKey, normalizeModuleListFilters(filters)] as const;
};

export const modulesAllQueryKey = (filters?: Partial<ModuleListFilters>) => [
  ...modulesRootQueryKey,
  "all",
  normalizeModuleListFilters(filters),
];

export const moduleDetailQueryKey = (moduleId: string | undefined) => [
  ...modulesRootQueryKey,
  "detail",
  moduleId ?? "none",
];

export const moduleBranchesQueryKey = (moduleId: string, query: string) => [
  ...modulesRootQueryKey,
  "branches",
  moduleId,
  query,
];

export const moduleBranchCommitQueryKey = (moduleId: string, branch: string) => [
  ...modulesRootQueryKey,
  "branch-commit",
  moduleId,
  branch,
];

type ModuleAPIRecord = APISchemas["Module"];

export type ModuleBranchCommit = APISchemas["BranchCommit"];

type ModuleBranchesAPIResponse = APISchemas["ModuleBranchesResponse"];

type ModuleDetailAPIResponse = APISchemas["ModuleDetailResponse"];

type ModulesAPIResponse = APISchemas["ModulesResponse"];

export class ModulesAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(payload?.error || `Request ${path} failed with ${status}`);
    this.name = "ModulesAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new ModulesAPIError(path, status, payload),
  { allowEmpty: true },
);

export async function fetchModulesSnapshot(
  filters?: Partial<ModuleListRequest>,
): Promise<ModulesSnapshot> {
  const payload = await fetchJSON<ModulesAPIResponse>(buildModulesSnapshotPath(filters));

  return {
    modules: payload.modules.map(normalizeModule),
    pagination: payload.pagination,
    summary: payload.summary,
  };
}

export async function fetchAllModulesSnapshot(
  filters?: Partial<ModuleListFilters>,
): Promise<ModulesSnapshot> {
  const { items, snapshot } = await fetchAllPaginatedItems(
    (pagination) => fetchModulesSnapshot({ ...filters, ...pagination }),
    (pageSnapshot) => pageSnapshot.modules,
  );

  return {
    ...snapshot,
    modules: items,
  };
}

export async function fetchModuleDetailSnapshot(moduleId: string): Promise<ModulesSnapshot> {
  const payload = await fetchJSON<ModuleDetailAPIResponse>(
    `/api/v1/modules/${encodeURIComponent(moduleId)}`,
  );
  const module = normalizeModule(payload.module);

  return {
    modules: [module],
    pagination: {
      page: 1,
      pageSize: 1,
      total: 1,
    },
    summary: {
      common: module.kind === "Common" ? 1 : 0,
      feature: module.kind === "Feature" ? 1 : 0,
      total: 1,
    },
  };
}

/** 搜索模块绑定仓库的分支，后端最多返回 50 条。 */
export async function searchModuleBranches(moduleId: string, query: string): Promise<string[]> {
  const params = new URLSearchParams({ query });
  const payload = await fetchJSON<ModuleBranchesAPIResponse>(
    `/api/v1/modules/${encodeURIComponent(moduleId)}/branches?${params.toString()}`,
  );

  return payload.branches;
}

/** 查询模块仓库某个分支当前最新的提交；分支不存在时后端返回 404。 */
export async function fetchModuleBranchCommit(
  moduleId: string,
  branch: string,
): Promise<ModuleBranchCommit> {
  const params = new URLSearchParams({ branch });
  const payload = await fetchJSON<APISchemas["ModuleBranchCommitResponse"]>(
    `/api/v1/modules/${encodeURIComponent(moduleId)}/branch-commit?${params.toString()}`,
  );

  return payload.commit;
}

export function normalizeModuleListFilters(
  filters?: Partial<ModuleListRequest>,
): ModuleListRequest {
  return {
    applicationId: filters?.applicationId?.trim() ?? "",
    keyword: filters?.keyword?.trim() ?? "",
    kind: filters?.kind ?? "",
    owner: filters?.owner?.trim() ?? "",
    ...normalizePagination(filters),
  };
}

function buildModulesSnapshotPath(filters?: Partial<ModuleListRequest>) {
  const normalizedFilters = normalizeModuleListFilters(filters);
  const params = new URLSearchParams();

  params.set("page", String(normalizedFilters.page));
  params.set("pageSize", String(normalizedFilters.pageSize));

  if (normalizedFilters.kind) {
    params.set("kind", normalizedFilters.kind);
  }
  if (normalizedFilters.applicationId) {
    params.set("applicationId", normalizedFilters.applicationId);
  }
  if (normalizedFilters.owner) {
    params.set("owner", normalizedFilters.owner);
  }
  if (normalizedFilters.keyword) {
    params.set("keyword", normalizedFilters.keyword);
  }

  const query = params.toString();

  return query ? `/api/v1/modules?${query}` : "/api/v1/modules";
}

function normalizeModule(module: ModuleAPIRecord): ModuleRecord {
  return module;
}
