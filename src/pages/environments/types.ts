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

export type EnvironmentBundleRow = {
  id: string;
  moduleName: string;
  moduleType: "Common Bundle" | "Feature Bundle";
  version: string;
  size: string;
  build: string;
  branch: string;
  owner: string;
  status: "运行中" | "已验证" | "灰度中" | "待验证";
};

export type EnvironmentGuardrail = {
  id: string;
  label: string;
  value: string;
  status: "通过" | "关注";
};

export type EnvironmentTimelineItem = {
  id: string;
  time: string;
  action: string;
  operator: string;
  status: "成功" | "进行中" | "等待";
  detail: string;
};

export type EnvironmentDetail = {
  id: EnvironmentCode;
  endpoint: string;
  cdnDomain: string;
  branchPolicy: string;
  releasePolicy: string;
  currentRelease: string;
  bundleCount: number;
  totalSize: string;
  healthScore: string;
  bundles: EnvironmentBundleRow[];
  guardrails: EnvironmentGuardrail[];
  timeline: EnvironmentTimelineItem[];
};

export type EnvironmentsSnapshot = {
  environments: RuntimeEnvironment[];
  matrix: BundleVersionMatrixRow[];
  details: Record<EnvironmentCode, EnvironmentDetail>;
};
