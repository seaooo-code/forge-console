import {
  fetchModulesSnapshot,
  modulesRootQueryKey,
  modulesSnapshotQueryKey,
  normalizeModuleListFilters,
} from "@/api/modules";

import type {
  ModuleMutationInput,
  ModuleRecord,
  ModuleRepositoryBinding,
  ModulesSnapshot,
} from "../types";

export {
  fetchModulesSnapshot,
  modulesRootQueryKey,
  modulesSnapshotQueryKey,
  normalizeModuleListFilters,
};

export const moduleDetailQueryKey = (moduleId: string | undefined) => [
  ...modulesRootQueryKey,
  "detail",
  moduleId ?? "none",
];

export const moduleEditQueryKey = (moduleId: string | undefined) => [
  ...modulesRootQueryKey,
  "edit",
  moduleId ?? "none",
];

type ModuleAPIRecord = ModuleRecord;

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
    super(getModuleAPIErrorMessage(path, status, payload));
    this.name = "ModuleAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const moduleAPIErrorMessages: Record<string, string> = {
  "application already has common module": "当前应用已关联通用模块，每个应用只能关联一个通用模块",
  "common module must belong to same application": "通用模块必须属于当前关联应用",
  "build record not found": "构建记录不存在",
  "build service unavailable": "构建服务暂不可用",
  "environment not found": "环境不存在",
  "feature module requires common module": "功能模块必须选择当前应用的通用模块",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid module request": "模块参数无效，请检查表单",
  "invalid build request": "构建参数无效，请检查分支和环境",
  "module id already exists": "模块 ID 已存在，请更换后重试",
  "module is referenced": "模块已被引用，不能删除",
  "module not found": "模块不存在",
  "module repository already exists": "该仓库已绑定其他模块，请选择未绑定仓库",
  "storage configuration not found": "环境未绑定有效存储配置，无法构建",
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

export async function fetchModuleDetailSnapshot(moduleId: string): Promise<ModulesSnapshot> {
  const payload = await fetchJSON<ModuleDetailAPIResponse>(
    `/api/v1/modules/${encodeURIComponent(moduleId)}`,
  );
  const module = normalizeModule(payload.module);

  return {
    modules: [module],
    summary: {
      common: module.kind === "Common" ? 1 : 0,
      feature: module.kind === "Feature" ? 1 : 0,
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

function getModuleAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  if (payload?.error) {
    return moduleAPIErrorMessages[payload.error] ?? payload.error;
  }

  return `Request ${path} failed with ${status}`;
}

function normalizeModule(module: ModuleAPIRecord): ModuleRecord {
  return module;
}
