import type { ModuleFormState, ModuleKind } from "../types";

export const defaultForm: ModuleFormState = {
  applicationId: "",
  commonModuleId: "",
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
  repositoryKeyword: "",
};

export const kindClass: Record<ModuleKind, string> = {
  Common: "border-warning/40 bg-warning/10 text-warning",
  Feature: "border-info/30 bg-info/10 text-info",
};

export const kindOptions: Array<{ label: string; value: ModuleKind }> = [
  { label: "通用模块", value: "Common" },
  { label: "功能模块", value: "Feature" },
];
