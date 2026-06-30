export type MetricIconName =
  | "accessToken"
  | "app"
  | "build"
  | "codeSource"
  | "environment"
  | "module"
  | "release"
  | "storage";

export type SummaryMetric = {
  description: string;
  id: string;
  label: string;
  value: string;
  trend: string;
  trendTone: "positive" | "negative" | "neutral";
  icon: MetricIconName;
  iconTone: "amber" | "blue" | "cyan" | "emerald" | "indigo" | "red" | "slate" | "violet";
  sparkline: number[];
};

export type BuildTrendPoint = {
  date: string;
  buildCount: number;
  successCount: number;
};

export type RecentBuildRecord = {
  application: string;
  duration: string;
  environment: string;
  id: string;
  module: string;
  operator: string;
  startedAt: string;
  status: "failed" | "queued" | "running" | "success";
};

export type ReleaseRecord = {
  application: string;
  id: string;
  environment: string;
  gray: string;
  module: string;
  status: "active" | "inactive";
  updatedAt: string;
};

export type ResourceStatus = {
  description: string;
  href: string;
  id: string;
  label: string;
  status: "attention" | "healthy" | "neutral";
  statusLabel: string;
  value: string;
};

export type DashboardSnapshot = {
  metrics: SummaryMetric[];
  buildTrend: BuildTrendPoint[];
  builds: RecentBuildRecord[];
  releases: ReleaseRecord[];
  resources: ResourceStatus[];
  updatedAt: string;
};
