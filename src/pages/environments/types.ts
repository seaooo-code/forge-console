import type { MiCarEnvironmentCode } from "@/types/environments";

export type EnvironmentCode = MiCarEnvironmentCode;

export type EnvironmentStatus = "健康" | "灰度中";

export type EnvironmentCardTone = "amber" | "blue" | "emerald" | "rose" | "sky";

export type BundleVersionMatrixRow = {
  id: string;
  moduleName: string;
  moduleType: "Common Bundle" | "Feature Bundle";
  dev: string;
  staging: string;
  preview: string;
  preProduct: string;
  product: string;
};

export type RuntimeEnvironment = {
  id: EnvironmentCode;
  code: string;
  name: string;
  status: EnvironmentStatus;
  tone: EnvironmentCardTone;
  description: string;
  currentCombination: string;
  traffic: string;
  updatedAt: string;
};

export type EnvironmentsSnapshot = {
  environments: RuntimeEnvironment[];
  matrix: BundleVersionMatrixRow[];
};
