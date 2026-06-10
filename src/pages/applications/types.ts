export type ApplicationStatus = "运行中" | "维护中" | "已下线";

export type HostApplication = {
  id: string;
  name: string;
  slug: string;
  platform: string;
  owner: string;
  moduleCount: number;
  environmentCount: number;
  createdAt: string;
  status: ApplicationStatus;
};

export type ApplicationMetricTone = "blue" | "emerald" | "amber" | "rose" | "slate";

export type ApplicationDetailMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: ApplicationMetricTone;
};

export type ApplicationEnvironmentRecord = {
  id: string;
  environment: "dev" | "staging" | "preview" | "preProduct" | "product";
  combination: string;
  bundleCount: number;
  traffic: string;
  updatedAt: string;
  status: "健康" | "灰度中" | "维护中";
};

export type ApplicationModuleRecord = {
  id: string;
  name: string;
  kind: "Common" | "Feature";
  repository: string;
  owner: string;
  latestVersion: string;
  pipeline: string;
  status: "活跃" | "冻结";
};

export type ApplicationMemberRecord = {
  id: string;
  name: string;
  role: "Owner" | "Developer" | "QA" | "Release";
  team: string;
};

export type ApplicationPipelineRecord = {
  id: string;
  runId: string;
  moduleName: string;
  branch: string;
  status: "success" | "running" | "failed" | "queued";
  duration: string;
  operator: string;
  startedAt: string;
};

export type ApplicationDetail = {
  id: string;
  appKey: string;
  slug: string;
  name: string;
  description: string;
  repositoryGroup: string;
  ownerTeam: string;
  packageName: string;
  bundleNamespace: string;
  releasePolicy: string;
  metrics: ApplicationDetailMetric[];
  environments: ApplicationEnvironmentRecord[];
  modules: ApplicationModuleRecord[];
  members: ApplicationMemberRecord[];
  pipelines: ApplicationPipelineRecord[];
};

export type ApplicationSummary = {
  total: number;
  running: number;
  maintenance: number;
  offline: number;
};

export type ApplicationsSnapshot = {
  applications: HostApplication[];
  details: Record<string, ApplicationDetail>;
  summary: ApplicationSummary;
};
