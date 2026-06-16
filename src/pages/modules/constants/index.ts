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
  Common: "border-amber-200 bg-amber-50 text-amber-700",
  Feature: "border-sky-200 bg-sky-50 text-sky-700",
};

export const kindOptions: Array<{ label: string; value: ModuleKind }> = [
  { label: "通用模块", value: "Common" },
  { label: "功能模块", value: "Feature" },
];
