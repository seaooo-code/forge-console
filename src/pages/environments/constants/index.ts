import type {
  EnvironmentCardTone,
  EnvironmentFormState,
  EnvironmentStatus,
  EnvironmentStatusCode,
} from "../types";

export const defaultForm: EnvironmentFormState = {
  code: "",
  description: "",
  name: "",
  status: "healthy",
  storageConfigurationId: "",
  tone: "blue",
};

export const environmentToneClass: Record<EnvironmentCardTone, string> = {
  amber: "border-t-amber-500",
  blue: "border-t-blue-500",
  emerald: "border-t-emerald-500",
  rose: "border-t-rose-500",
  sky: "border-t-sky-500",
};

export const statusClass: Record<EnvironmentStatus, string> = {
  健康: "border-emerald-200 bg-emerald-50 text-emerald-700",
  灰度中: "border-amber-200 bg-amber-50 text-amber-700",
};

export const statusOptions: Array<{ label: string; value: EnvironmentStatusCode }> = [
  { label: "健康", value: "healthy" },
  { label: "灰度中", value: "gray" },
];

export const toneOptions: Array<{ label: string; value: EnvironmentCardTone }> = [
  { label: "蓝色", value: "blue" },
  { label: "天蓝", value: "sky" },
  { label: "绿色", value: "emerald" },
  { label: "琥珀", value: "amber" },
  { label: "玫红", value: "rose" },
];
