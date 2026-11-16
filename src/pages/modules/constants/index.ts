import type { BuildMode, BuildVariableFormState, ModuleFormState, ModuleKind } from "../types";

export const defaultModuleBuildConfig: ModuleFormState["buildConfig"] = {
  autoBuildBranches: [],
  autoBuildEnvironment: "",
  autoPreviewRelease: false,
  autoPreviewTtlHours: 168,
  buildAdapterId: "",
  buildAdapterParams: {},
  buildContext: ".",
  buildMode: "dockerfile",
  dockerfilePath: "Dockerfile",
};

export const buildModeLabels: Record<BuildMode, string> = {
  adapter: "构建适配器",
  dockerfile: "仓库 Dockerfile",
};

export const defaultForm: ModuleFormState = {
  applicationId: "",
  buildConfig: defaultModuleBuildConfig,
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
  Common: "border-warning/40 bg-warning/10 text-warning",
  Feature: "border-info/30 bg-info/10 text-info",
};

export const kindOptions: Array<{ label: string; value: ModuleKind }> = [
  { label: "通用模块", value: "Common" },
  { label: "功能模块", value: "Feature" },
];

/** Radix Select 不接受空字符串作为选项值，"不自动构建 / 全部环境"用这个占位值映射到空字符串。 */
export const emptySelectValue = "__none__";

export const maxAutoBuildBranches = 20;

export const maxAutoPreviewTtlHours = 24 * 365;

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
