import { moduleStatusLabelByCode } from "../constants";
import type {
  ModuleListFilters,
  ModuleMutationInput,
  ModuleRecord,
  ModuleRepositoryBinding,
  ModuleStatusCode,
  ModulesSnapshot,
} from "../types";

export const modulesRootQueryKey = ["modules-snapshot"] as const;

export const modulesSnapshotQueryKey = (filters?: Partial<ModuleListFilters>) => {
  const normalizedFilters = normalizeModuleListFilters(filters);

  if (!hasModuleListFilters(normalizedFilters)) {
    return modulesRootQueryKey;
  }

  return [...modulesRootQueryKey, normalizedFilters] as const;
};

export const moduleEditQueryKey = (moduleId: string | undefined) => [
  ...modulesRootQueryKey,
  "edit",
  moduleId ?? "none",
];

type ModuleAPIRecord = Omit<ModuleRecord, "status"> & {
  status: ModuleStatusCode | ModuleRecord["status"];
};

type ModulesAPIResponse = {
  modules: ModuleAPIRecord[];
  summary: ModulesSnapshot["summary"];
};

type ModuleDetailAPIResponse = {
  module: ModuleAPIRecord;
};

type CodeSourceRepositorySearchResponse = {
  repositories: CodeSourceRepositoryAPIRecord[];
};

type CodeSourceRepositoryAPIRecord = {
  cloneUrl: string;
  defaultBranch: string;
  fullName: string;
  htmlUrl: string;
  id: string;
  installationId: string;
  provider: "github";
  sshUrl: string;
};

type APIErrorPayload = {
  error?: string;
};

export class ModuleAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(payload?.error || `Request ${path} failed with ${status}`);
    this.name = "ModuleAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

export async function fetchModulesSnapshot(
  filters?: Partial<ModuleListFilters>,
): Promise<ModulesSnapshot> {
  const payload = await fetchJSON<ModulesAPIResponse>(buildModulesSnapshotPath(filters));

  return {
    modules: payload.modules.map(normalizeModule),
    summary: payload.summary,
  };
}

export async function fetchModuleDetailSnapshot(moduleId: string): Promise<ModulesSnapshot> {
  const payload = await fetchJSON<ModuleDetailAPIResponse>(
    `/api/v1/modules/${encodeURIComponent(moduleId)}`,
  );
  const module = normalizeModule(payload.module);

  return {
    modules: [module],
    summary: {
      active: module.status === "活跃" ? 1 : 0,
      common: module.kind === "Common" ? 1 : 0,
      feature: module.kind === "Feature" ? 1 : 0,
      frozen: module.status === "冻结" ? 1 : 0,
      total: 1,
    },
  };
}

export async function createModule(input: ModuleMutationInput): Promise<ModuleRecord> {
  const payload = await fetchJSON<ModuleDetailAPIResponse>("/api/v1/modules", {
    body: JSON.stringify(input),
    method: "POST",
  });

  return normalizeModule(payload.module);
}

export async function updateModule(
  moduleId: string,
  input: ModuleMutationInput,
): Promise<ModuleRecord> {
  const { id: _id, ...payloadInput } = input;
  const payload = await fetchJSON<ModuleDetailAPIResponse>(
    `/api/v1/modules/${encodeURIComponent(moduleId)}`,
    {
      body: JSON.stringify(payloadInput),
      method: "PATCH",
    },
  );

  return normalizeModule(payload.module);
}

export async function deleteModule(moduleId: string): Promise<void> {
  await fetchJSON<void>(`/api/v1/modules/${encodeURIComponent(moduleId)}`, {
    method: "DELETE",
  });
}

export async function searchCodeSourceRepositories(
  query: string,
): Promise<ModuleRepositoryBinding[]> {
  const params = new URLSearchParams({
    pageSize: "10",
    query,
  });
  const payload = await fetchJSON<CodeSourceRepositorySearchResponse>(
    `/api/v1/code-sources/github/repositories/search?${params.toString()}`,
  );

  return payload.repositories.map((repository) => ({
    cloneUrl: repository.cloneUrl,
    defaultBranch: repository.defaultBranch,
    fullName: repository.fullName,
    htmlUrl: repository.htmlUrl,
    id: repository.id,
    installationId: repository.installationId,
    provider: repository.provider,
    sshUrl: repository.sshUrl,
  }));
}

export function normalizeModuleListFilters(
  filters?: Partial<ModuleListFilters>,
): ModuleListFilters {
  return {
    keyword: filters?.keyword?.trim() ?? "",
    kind: filters?.kind ?? "",
    owner: filters?.owner?.trim() ?? "",
    status: filters?.status ?? "",
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
    throw new ModuleAPIError(path, response.status, payload);
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

function buildModulesSnapshotPath(filters?: Partial<ModuleListFilters>) {
  const normalizedFilters = normalizeModuleListFilters(filters);
  const params = new URLSearchParams();

  if (normalizedFilters.kind) {
    params.set("kind", normalizedFilters.kind);
  }
  if (normalizedFilters.status) {
    params.set("status", normalizedFilters.status);
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

function hasModuleListFilters(filters: ModuleListFilters) {
  return Boolean(filters.kind || filters.status || filters.owner || filters.keyword);
}

function normalizeModule(module: ModuleAPIRecord): ModuleRecord {
  return {
    ...module,
    status:
      module.status === "active" || module.status === "frozen"
        ? moduleStatusLabelByCode[module.status]
        : module.status,
  };
}
