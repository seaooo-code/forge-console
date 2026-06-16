export type ModuleStatus = "冻结" | "活跃";

export type ModuleStatusCode = "active" | "frozen";

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
  status: ModuleStatus;
};

export type ModulesSnapshot = {
  modules: ModuleRecord[];
  summary: ModuleSummary;
};

export type ModuleSummary = {
  active: number;
  common: number;
  feature: number;
  frozen: number;
  total: number;
};

export type ModuleMutationInput = {
  applicationId: string;
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
  status: ModuleStatusCode;
};

export type ModuleFormState = {
  applicationId: string;
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
  status: ModuleStatusCode;
};

export type ModuleListFilters = {
  keyword: string;
  kind: ModuleKind | "";
  owner: string;
  status: ModuleStatusCode | "";
};
