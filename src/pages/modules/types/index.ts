export type ModuleStatus = "冻结" | "活跃";

export type ModuleKind = "Common" | "Feature";

export type ModuleApplicationOption = {
  label: string;
  value: string;
};

export type ModuleRecord = {
  applicationId: string;
  applicationName: string;
  id: string;
  name: string;
  kind: ModuleKind;
  owner: string;
  repository: string;
  status: ModuleStatus;
};

export type ModulesSnapshot = {
  modules: ModuleRecord[];
};

export type ModuleMutationInput = {
  applicationId: string;
  id: string;
  name: string;
  kind: ModuleKind;
  owner: string;
  repository: string;
  status: ModuleStatus;
};

export type ModuleFormState = ModuleMutationInput;
