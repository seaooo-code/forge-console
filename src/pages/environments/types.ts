export type EnvironmentCode = "dev" | "test" | "pre" | "prod";

export type EnvironmentStatus = "健康" | "灰度中";

export type EnvironmentCardTone = "amber" | "blue" | "rose" | "sky";

export type BundleVersionMatrixRow = {
  id: string;
  moduleName: string;
  moduleType: "Common Bundle" | "Feature Bundle";
  dev: string;
  test: string;
  pre: string;
  prod: string;
};

export type RuntimeEnvironment = {
  id: EnvironmentCode;
  code: Uppercase<EnvironmentCode>;
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
