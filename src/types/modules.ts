export type ModuleKind = "Common" | "Feature";

export type ModuleApplicationOption = {
  label: string;
  value: string;
};

export type ModuleRepositoryBinding = {
  cloneUrl: string;
  defaultBranch: string;
  fullName: string;
  htmlUrl: string;
  id: string;
  installationId: string;
  provider: "github";
  sshUrl: string;
};

export type ModuleRecord = {
  applicationId: string;
  applicationName: string;
  applicationSlug: string;
  commonModuleId: string;
  commonModuleName: string;
  defaultBranch: string;
  id: string;
  name: string;
  kind: ModuleKind;
  owner: string;
  ownerAvatarUrl: string;
  ownerEmail: string;
  ownerUserId: string;
  repository: string;
  repositoryCloneUrl: string;
  repositoryFullName: string;
  repositoryHtmlUrl: string;
  repositoryId: string;
  repositoryInstallationId: string;
  repositoryProvider: "github";
  repositorySshUrl: string;
};

export type ModulesSnapshot = {
  modules: ModuleRecord[];
  summary: ModuleSummary;
};

export type ModuleSummary = {
  common: number;
  feature: number;
  total: number;
};

export type ModuleMutationInput = {
  applicationId: string;
  commonModuleId?: string;
  id: string;
  name: string;
  kind: ModuleKind;
  owner: string;
  ownerAvatarUrl: string;
  ownerDepartmentIds: string[];
  ownerEmail: string;
  ownerFeishuOpenId?: string;
  ownerFeishuUnionId?: string;
  ownerFeishuUserId?: string;
  ownerUserId: string;
  repository: ModuleRepositoryBinding;
};

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
