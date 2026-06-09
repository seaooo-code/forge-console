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

export type ApplicationSummary = {
  total: number;
  running: number;
  maintenance: number;
  offline: number;
};

export type ApplicationsSnapshot = {
  applications: HostApplication[];
  summary: ApplicationSummary;
};
