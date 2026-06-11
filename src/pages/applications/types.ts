export type ApplicationStatus = "运行中" | "维护中" | "已下线";
export type ApplicationStatusCode = "running" | "maintenance" | "offline";

export type HostApplication = {
  id: string;
  name: string;
  slug: string;
  platform: string;
  owner: string;
  ownerEmail: string;
  ownerAvatarUrl: string;
  ownerDepartmentIds: string[];
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
  owner: string;
  ownerEmail: string;
  ownerAvatarUrl: string;
  ownerDepartmentIds: string[];
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

export type ApplicationEnvironmentInput = {
  environment: ApplicationEnvironmentRecord["environment"];
};

export type ApplicationMemberInput = {
  name: string;
  role: ApplicationMemberRecord["role"];
  team: string;
};

export type ApplicationOption = {
  label: string;
  value: string;
};

export type ApplicationOptions = {
  applicationStatuses: ApplicationOption[];
  environments: ApplicationOption[];
  owners: ApplicationOption[];
  platforms: ApplicationOption[];
};

export type FeishuUserSearchResult = {
  id: string;
  unionId: string;
  openId: string;
  userId: string;
  name: string;
  enName: string;
  avatarUrl: string;
  email: string;
  mobile: string;
  departmentIds: string[];
};

export type ApplicationMutationInput = {
  slug?: string;
  name: string;
  platform: string;
  owner: string;
  ownerEmail: string;
  ownerAvatarUrl: string;
  ownerDepartmentIds: string[];
  description: string;
  status: ApplicationStatusCode;
  environments: ApplicationEnvironmentInput[];
};
