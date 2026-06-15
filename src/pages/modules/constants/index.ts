import type { ModuleApplicationOption, ModuleFormState, ModuleKind, ModuleStatus } from "../types";

export const defaultForm: ModuleFormState = {
  applicationId: "mi-car",
  id: "",
  kind: "Feature",
  name: "",
  owner: "",
  repository: "",
  status: "活跃",
};

export const kindClass: Record<ModuleKind, string> = {
  Common: "border-amber-200 bg-amber-50 text-amber-700",
  Feature: "border-sky-200 bg-sky-50 text-sky-700",
};

export const statusClass: Record<ModuleStatus, string> = {
  冻结: "border-slate-200 bg-slate-50 text-slate-600",
  活跃: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export const kindOptions: Array<{ label: string; value: ModuleKind }> = [
  { label: "Common Bundle", value: "Common" },
  { label: "Feature Bundle", value: "Feature" },
];

export const statusOptions: Array<{ label: string; value: ModuleStatus }> = [
  { label: "活跃", value: "活跃" },
  { label: "冻结", value: "冻结" },
];

export const moduleApplicationOptions: ModuleApplicationOption[] = [
  { label: "小米汽车 App", value: "mi-car" },
  { label: "车机端应用", value: "cockpit" },
  { label: "海外版 App", value: "global-app" },
  { label: "售后服务台", value: "service-console" },
];
