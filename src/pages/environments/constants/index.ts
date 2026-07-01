import type { EnvironmentCardTone, EnvironmentFormState } from "../types";

export const defaultForm: EnvironmentFormState = {
  code: "",
  description: "",
  name: "",
  status: "healthy",
  storageConfigurationId: "",
  tone: "blue",
};

export const environmentToneClass: Record<EnvironmentCardTone, string> = {
  amber: "border-t-amber-500 dark:border-t-amber-400",
  blue: "border-t-blue-500 dark:border-t-blue-400",
  emerald: "border-t-emerald-500 dark:border-t-emerald-400",
  rose: "border-t-rose-500 dark:border-t-rose-400",
  sky: "border-t-sky-500 dark:border-t-sky-400",
};

export const toneOptions: Array<{ label: string; value: EnvironmentCardTone }> = [
  { label: "蓝色", value: "blue" },
  { label: "天蓝", value: "sky" },
  { label: "绿色", value: "emerald" },
  { label: "琥珀", value: "amber" },
  { label: "玫红", value: "rose" },
];
