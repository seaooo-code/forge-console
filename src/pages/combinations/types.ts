export type CombinationEnvironment = "dev" | "pre" | "prod" | "test";

export type CombinationStatus = "历史版本" | "已回滚" | "滚动更新" | "运行中";

export type BundleCompositionKind = "Common" | "Feature";

export type BundleCompositionRecord = {
  id: string;
  kind: BundleCompositionKind;
  module: string;
  required: boolean;
  sizeKb: number;
  version: string;
};

export type CombinationOverview = {
  bundleCount: number;
  bundles: BundleCompositionRecord[];
  createdAt: string;
  creator: string;
  environmentLabel: string;
  name: string;
  status: CombinationStatus;
};

export type CombinationRecord = {
  bundleCount: number;
  createdAt: string;
  creator: string;
  editable: boolean;
  environment: CombinationEnvironment;
  id: string;
  locked: boolean;
  name: string;
  status: CombinationStatus;
};

export type CombinationsSnapshot = {
  current: CombinationOverview;
  combinations: CombinationRecord[];
};
