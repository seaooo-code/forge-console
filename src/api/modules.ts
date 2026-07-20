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

type ModuleAPIRecord = ModuleRecord;

type ModuleDetailAPIResponse = {
  module: ModuleAPIRecord;
};

type ModulesAPIResponse = {
  modules: ModuleAPIRecord[];
  pagination: ModulesSnapshot["pagination"];
  summary: ModulesSnapshot["summary"];
};

type APIErrorPayload = {
  error?: string;
};

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

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
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

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    ...init,
    headers: init?.body
      ? {
          "Content-Type": "application/json",
          ...init.headers,
        }
      : init?.headers,
  });

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw new ModulesAPIError(path, response.status, payload);
  }

  if (
    response.status === 204 ||
    !response.headers.get("content-type")?.includes("application/json")
  ) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readErrorPayload(response: Response): Promise<APIErrorPayload | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  try {
    return (await response.json()) as APIErrorPayload;
  } catch (_error) {
    return undefined;
  }
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
