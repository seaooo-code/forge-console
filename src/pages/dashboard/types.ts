import type { MiCarEnvironmentCode } from "@/types/environments";

export type MetricIconName = "app" | "bundle" | "module" | "pipeline" | "release" | "task";

export type SummaryMetric = {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendTone: "positive" | "negative";
  icon: MetricIconName;
  iconTone: "blue" | "cyan" | "amber" | "green" | "sky" | "red";
  sparkline: number[];
};

export type BuildTrendPoint = {
  date: string;
  buildCount: number;
  successCount: number;
};

export type PipelineSuccessRate = {
  name: string;
  rate: number;
};

export type DevTask = {
  id: string;
  title: string;
  developer: string;
  moduleCount: number;
  status: "dev" | "test" | "review" | "done";
};

export type ReleaseRecord = {
  id: string;
  environment: Exclude<MiCarEnvironmentCode, "dev">;
  gray: string;
  status: "灰度中" | "已完成" | "已回滚";
};

export type DashboardSnapshot = {
  metrics: SummaryMetric[];
  buildTrend: BuildTrendPoint[];
  pipelineRates: PipelineSuccessRate[];
  tasks: DevTask[];
  releases: ReleaseRecord[];
  updatedAt: string;
};
