import type { EnvironmentCardTone, EnvironmentFormState, RuntimeEnvironment } from "../types";

export const defaultForm: EnvironmentFormState = {
  code: "",
  description: "",
  name: "",
  status: "healthy",
  storageConfigurationId: "",
  tone: "blue",
};

export const environmentDotClass: Record<EnvironmentCardTone, string> = {
  amber: "bg-amber-500 dark:bg-amber-400",
  blue: "bg-blue-500 dark:bg-blue-400",
  emerald: "bg-emerald-500 dark:bg-emerald-400",
  rose: "bg-rose-500 dark:bg-rose-400",
  sky: "bg-sky-500 dark:bg-sky-400",
};

export const environmentStatusLabels: Record<RuntimeEnvironment["status"], string> = {
  gray: "灰度中",
  healthy: "正常",
};

export const toneOptions: Array<{ label: string; value: EnvironmentCardTone }> = [
  { label: "蓝色", value: "blue" },
  { label: "天蓝", value: "sky" },
  { label: "绿色", value: "emerald" },
  { label: "琥珀", value: "amber" },
  { label: "玫红", value: "rose" },
];
