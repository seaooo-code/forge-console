import type { BuildMode, BuildVariableFormState, ModuleFormState, ModuleKind } from "../types";

export const defaultModuleBuildConfig: ModuleFormState["buildConfig"] = {
  autoBuildBranches: [],
  autoBuildEnvironment: "",
  buildAdapterId: "",
  buildAdapterParams: {},
  buildContext: ".",
  buildMode: "dockerfile",
  ciArtifactPath: "dist",
  ciJob: "",
  dockerfilePath: "Dockerfile",
};

export const buildModeLabels: Record<BuildMode, string> = {
  adapter: "构建适配器",
  dockerfile: "仓库 Dockerfile",
  gitlab_ci: "GitLab CI",
};

export const defaultForm: ModuleFormState = {
  applicationId: "",
  buildConfig: defaultModuleBuildConfig,
  buildVariables: [],
  commonModuleId: "",
  connectionId: "",
  id: "",
  kind: "Feature",
  name: "",
  owner: "",
  ownerAvatarUrl: "",
  ownerDepartmentIds: [],
  ownerEmail: "",
  ownerFeishuOpenId: "",
  ownerFeishuUnionId: "",
  ownerFeishuUserId: "",
  ownerUserId: "",
  repository: null,
};

export const kindClass: Record<ModuleKind, string> = {
  Common: "bg-warning/14 text-warning-foreground dark:text-warning",
  Feature: "bg-info-soft text-info",
};

export const kindLabels: Record<ModuleKind, string> = {
  Common: "通用模块",
  Feature: "功能模块",
};

export const kindOptions: Array<{ label: string; value: ModuleKind }> = [
  { label: "通用模块", value: "Common" },
  { label: "功能模块", value: "Feature" },
];

/** Radix Select 不接受空字符串作为选项值，"不自动构建 / 全部环境"用这个占位值映射到空字符串。 */
export const emptySelectValue = "__none__";

export const maxAutoBuildBranches = 20;

export const buildVariableKeyPattern = /^[A-Z][A-Z0-9_]{0,63}$/;

export const reservedBuildVariablePrefix = "FORGE_";

export const buildVariableSecretMask = "******";

export const defaultBuildVariableForm: BuildVariableFormState = {
  environmentCode: "",
  isSecret: false,
  key: "",
  value: "",
};

export const codeSourceProviderLabels = {
  github: "GitHub",
  gitlab: "GitLab",
} as const;
