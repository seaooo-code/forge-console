import type { ModuleFormState, ModuleKind, ModuleStatus, ModuleStatusCode } from "../types";

export const defaultForm: ModuleFormState = {
  applicationId: "",
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
  status: "active",
};

export const kindClass: Record<ModuleKind, string> = {
  Common: "border-amber-200 bg-amber-50 text-amber-700",
  Feature: "border-sky-200 bg-sky-50 text-sky-700",
};

export const statusClass: Record<ModuleStatus, string> = {
  冻结: "border-slate-200 bg-slate-50 text-slate-600",
  活跃: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export const moduleStatusLabelByCode: Record<ModuleStatusCode, ModuleStatus> = {
  active: "活跃",
  frozen: "冻结",
};

export const moduleStatusCodeByLabel: Record<ModuleStatus, ModuleStatusCode> = {
  冻结: "frozen",
  活跃: "active",
};

export const kindOptions: Array<{ label: string; value: ModuleKind }> = [
  { label: "Common Bundle", value: "Common" },
  { label: "Feature Bundle", value: "Feature" },
];

export const statusOptions: Array<{ label: ModuleStatus; value: ModuleStatusCode }> = [
  { label: "活跃", value: "active" },
  { label: "冻结", value: "frozen" },
];
