export type PipelineStatus = "healthy" | "warning" | "blocked";

export type PipelineRow = {
  id: string;
  service: string;
  owner: string;
  environment: "prod" | "stage" | "dev";
  status: PipelineStatus;
  deploys: number;
  failureRate: number;
  latency: number;
  cost: number;
  region: string;
  lastRun: string;
};

export type MetricPoint = {
  day: string;
  buildMinutes: number;
  successRate: number;
  incidents: number;
};

export type ConsoleSnapshot = {
  pipelines: PipelineRow[];
  metrics: MetricPoint[];
  updatedAt: string;
};
