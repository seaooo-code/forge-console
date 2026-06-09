import type { ConsoleSnapshot, MetricPoint, PipelineRow } from "../types";

export const consoleSnapshotQueryKey = ["console-snapshot"] as const;

const pipelines: PipelineRow[] = [
  {
    id: "pipe-api",
    service: "Control API",
    owner: "Platform",
    environment: "prod",
    status: "healthy",
    deploys: 38,
    failureRate: 0.7,
    latency: 141,
    cost: 12840,
    region: "us-east-1",
    lastRun: "09:42",
  },
  {
    id: "pipe-web",
    service: "Console Web",
    owner: "Experience",
    environment: "prod",
    status: "warning",
    deploys: 27,
    failureRate: 2.8,
    latency: 188,
    cost: 9020,
    region: "us-west-2",
    lastRun: "09:31",
  },
  {
    id: "pipe-worker",
    service: "Build Worker",
    owner: "Automation",
    environment: "prod",
    status: "blocked",
    deploys: 14,
    failureRate: 6.4,
    latency: 262,
    cost: 18760,
    region: "eu-central-1",
    lastRun: "08:58",
  },
  {
    id: "pipe-search",
    service: "Search Index",
    owner: "Data",
    environment: "stage",
    status: "healthy",
    deploys: 19,
    failureRate: 1.2,
    latency: 119,
    cost: 6410,
    region: "ap-southeast-1",
    lastRun: "09:22",
  },
  {
    id: "pipe-insights",
    service: "Insight Jobs",
    owner: "Analytics",
    environment: "dev",
    status: "healthy",
    deploys: 45,
    failureRate: 1.5,
    latency: 96,
    cost: 5120,
    region: "us-east-2",
    lastRun: "09:47",
  },
  {
    id: "pipe-billing",
    service: "Billing Sync",
    owner: "Revenue",
    environment: "prod",
    status: "warning",
    deploys: 12,
    failureRate: 3.3,
    latency: 214,
    cost: 11020,
    region: "us-east-1",
    lastRun: "08:44",
  },
];

const metrics: MetricPoint[] = [
  { day: "Mon", buildMinutes: 420, successRate: 97.1, incidents: 1 },
  { day: "Tue", buildMinutes: 390, successRate: 98.4, incidents: 0 },
  { day: "Wed", buildMinutes: 452, successRate: 96.6, incidents: 2 },
  { day: "Thu", buildMinutes: 376, successRate: 99.1, incidents: 0 },
  { day: "Fri", buildMinutes: 498, successRate: 95.8, incidents: 3 },
  { day: "Sat", buildMinutes: 228, successRate: 99.4, incidents: 0 },
  { day: "Sun", buildMinutes: 254, successRate: 98.9, incidents: 1 },
];

export async function fetchConsoleSnapshot(): Promise<ConsoleSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 240));

  return {
    pipelines,
    metrics,
    updatedAt: new Date().toISOString(),
  };
}
