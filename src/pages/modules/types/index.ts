export type {
  ModuleApplicationOption,
  ModuleFormState,
  ModuleKind,
  ModuleListFilters,
  ModuleMutationInput,
  ModuleRecord,
  ModuleRepositoryBinding,
  ModuleSummary,
  ModulesSnapshot,
} from "@/types/modules";

export type ModuleBuildFormState = {
  branch: string;
  environment: string;
};
