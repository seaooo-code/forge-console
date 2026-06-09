export type ModuleStatus = "冻结" | "活跃";

export type ModuleRecord = {
  defaultPipeline: string;
  id: string;
  name: string;
  kind: "Common" | "Feature";
  owner: string;
  productionVersion: string;
  repository: string;
  status: ModuleStatus;
};

export type ModulesSnapshot = {
  modules: ModuleRecord[];
};
