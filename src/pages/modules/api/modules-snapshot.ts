import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";
import {
  fetchAllModulesSnapshot,
  fetchModuleDetailSnapshot,
  fetchModulesSnapshot,
  moduleDetailQueryKey,
  modulesAllQueryKey,
  modulesRootQueryKey,
  modulesSnapshotQueryKey,
  normalizeModuleListFilters,
} from "@/api/modules";

import type {
  CodeSourceConnectionWebhook,
  CodeSourceRepository,
  ModuleBuildVariable,
  ModuleBuildVariableInput,
  ModuleMutationInput,
  ModuleRecord,
} from "../types";

export {
  fetchAllModulesSnapshot,
  fetchModuleDetailSnapshot,
  fetchModulesSnapshot,
  moduleDetailQueryKey,
  modulesAllQueryKey,
  modulesRootQueryKey,
  modulesSnapshotQueryKey,
  normalizeModuleListFilters,
};

export const moduleEditQueryKey = (moduleId: string | undefined) => [
  ...modulesRootQueryKey,
  "edit",
  moduleId ?? "none",
];

// 连接列表复用代码源页的公开出口，这里只放模块页专属的仓库搜索与 webhook 查询。
export const connectionRepositoriesQueryKey = (connectionId: string, query: string) => [
  ...modulesRootQueryKey,
  "connection",
  connectionId,
  "repositories",
  query,
];

export const connectionWebhookQueryKey = (connectionId: string) => [
  ...modulesRootQueryKey,
  "connection",
  connectionId,
  "webhook",
];

export const moduleBuildVariablesQueryKey = (moduleId: string) => [
  ...modulesRootQueryKey,
  "build-variables",
  moduleId,
];

type ModuleAPIRecord = APISchemas["Module"];

type ModuleDetailAPIResponse = APISchemas["ModuleDetailResponse"];

type CodeSourceRepositorySearchResponse = APISchemas["CodeSourceRepositorySearchResponse"];

type BuildVariablesResponse = APISchemas["BuildVariablesResponse"];

type BuildVariableDetailResponse = APISchemas["BuildVariableDetailResponse"];

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

const fetchJSON = createFetchClient(
  (path, status, payload) => new ModuleAPIError(path, status, payload),
  { allowEmpty: true },
);

const moduleAPIErrorMessages: Record<string, string> = {
  "application already has common module": "当前应用已关联通用模块，每个应用只能关联一个通用模块",
  "common module must belong to same application": "通用模块必须属于当前关联应用",
  "build adapter is disabled": "所选构建适配器已停用，请选择启用中的适配器",
  "build record not found": "构建记录不存在",
  "build service unavailable": "构建服务暂不可用",
  "build variable not found": "构建变量不存在",
  "build variable service unavailable": "构建变量服务暂不可用",
  "code source auth not configured": "代码源授权未配置",
  "code source authorization failed": "代码源授权失败，请检查连接凭证",
  "code source connection is not active": "代码源连接已停用，请先启用或更换连接",
  "code source connection not found": "代码源连接不存在",
  "code source repository not found": "仓库不存在，请重新搜索后选择",
  "environment not found": "环境不存在",
  "feature module requires common module": "功能模块必须选择当前应用的通用模块",
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid module request": "模块参数无效，请检查仓库和构建配置",
  "invalid build request": "构建参数无效，请检查分支和环境",
  "invalid build variable request":
    "构建变量参数无效：key 需匹配 ^[A-Z][A-Z0-9_]{0,63}$ 且不能以 FORGE_ 开头，密钥值不能为空",
  "build variable environment not found": "构建变量的作用环境不存在，请重新选择",
  "invalid code source request": "代码源请求参数无效",
  "module id already exists": "模块 ID 已存在，请更换后重试",
  "module is referenced":
    "模块仍有关联数据：已有构建或发布记录，或作为通用模块被功能模块引用，暂不能删除",
  "module not found": "模块不存在",
  "module repository already exists":
    "该仓库已用相同 Dockerfile 路径绑定其他模块，请更换仓库或 Dockerfile 路径",
  "storage configuration not found": "环境未绑定有效存储配置，无法构建",
};

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
  // 构建变量只在创建时随模块提交，编辑模块时走构建变量接口。
  const { buildVariables: _buildVariables, id: _id, ...payloadInput } = input;
  const updateInput: APISchemas["ModuleUpdateRequest"] = payloadInput;
  const payload = await fetchJSON<ModuleDetailAPIResponse>(
    `/api/v1/modules/${encodeURIComponent(moduleId)}`,
    {
      body: JSON.stringify(updateInput),
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

export async function searchConnectionRepositories(
  connectionId: string,
  query: string,
): Promise<CodeSourceRepository[]> {
  const params = new URLSearchParams({ pageSize: "20", query });
  const payload = await fetchJSON<CodeSourceRepositorySearchResponse>(
    `/api/v1/code-source-connections/${encodeURIComponent(connectionId)}/repositories?${params.toString()}`,
  );

  return payload.repositories;
}

export function fetchConnectionWebhook(connectionId: string): Promise<CodeSourceConnectionWebhook> {
  return fetchJSON<CodeSourceConnectionWebhook>(
    `/api/v1/code-source-connections/${encodeURIComponent(connectionId)}/webhook`,
  );
}

export async function fetchModuleBuildVariables(moduleId: string): Promise<ModuleBuildVariable[]> {
  const payload = await fetchJSON<BuildVariablesResponse>(
    `/api/v1/modules/${encodeURIComponent(moduleId)}/build-variables`,
  );

  return payload.variables;
}

export async function upsertModuleBuildVariable(
  moduleId: string,
  input: ModuleBuildVariableInput,
): Promise<ModuleBuildVariable> {
  const payload = await fetchJSON<BuildVariableDetailResponse>(
    `/api/v1/modules/${encodeURIComponent(moduleId)}/build-variables`,
    {
      body: JSON.stringify(input),
      method: "PUT",
    },
  );

  return payload.variable;
}

export async function deleteModuleBuildVariable(
  moduleId: string,
  variable: Pick<ModuleBuildVariable, "environmentCode" | "key">,
): Promise<void> {
  const params = new URLSearchParams({ key: variable.key });
  if (variable.environmentCode) {
    params.set("environmentCode", variable.environmentCode);
  }

  await fetchJSON<void>(
    `/api/v1/modules/${encodeURIComponent(moduleId)}/build-variables?${params.toString()}`,
    { method: "DELETE" },
  );
}

const invalidBuildAdapterPrefix = "invalid build adapter request: ";

function getModuleAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  // 适配器参数校验失败时后端直接返回中文原因，例如"必填参数 entry 没有值"。
  if (payload?.error?.startsWith(invalidBuildAdapterPrefix)) {
    return `适配器参数无效：${payload.error.slice(invalidBuildAdapterPrefix.length)}`;
  }
  if (payload?.error) {
    return moduleAPIErrorMessages[payload.error] ?? payload.error;
  }

  return `Request ${path} failed with ${status}`;
}

function normalizeModule(module: ModuleAPIRecord): ModuleRecord {
  return module;
}
