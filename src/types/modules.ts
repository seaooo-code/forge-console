import type { APISchemas } from "@/api/client";

import type { PaginationMeta, PaginationParams } from "./pagination";

export type ModuleKind = ModuleRecord["kind"];

export type ModuleApplicationOption = {
  label: string;
  value: string;
};

export type ModuleRepositoryBinding = APISchemas["ModuleRepositoryRequest"];

export type ModuleRecord = APISchemas["Module"];

export type ModulesSnapshot = {
  modules: ModuleRecord[];
  pagination: PaginationMeta;
  summary: ModuleSummary;
};

export type ModuleSummary = APISchemas["ModuleSummary"];

export type ModuleMutationInput = APISchemas["ModuleCreateRequest"];

export type ModuleFormState = {
  applicationId: string;
  commonModuleId: string;
  id: string;
  kind: ModuleKind;
  name: string;
  owner: string;
  ownerAvatarUrl: string;
  ownerDepartmentIds: string[];
  ownerEmail: string;
  ownerFeishuOpenId: string;
  ownerFeishuUnionId: string;
  ownerFeishuUserId: string;
  ownerUserId: string;
  repository: ModuleRepositoryBinding | null;
  repositoryKeyword: string;
};

export type ModuleListFilters = {
  applicationId: string;
  keyword: string;
  kind: ModuleKind | "";
  owner: string;
};

export type ModuleListRequest = ModuleListFilters & PaginationParams;
