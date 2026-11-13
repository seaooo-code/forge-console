import type { APISchemas } from "@/api/client";

export type MetricIconName = SummaryMetric["icon"];

export type SummaryMetric = APISchemas["DashboardMetric"];

export type BuildTrendPoint = APISchemas["DashboardBuildTrendPoint"];

export type RecentBuildRecord = APISchemas["DashboardBuildRecord"];

export type ReleaseRecord = APISchemas["DashboardReleaseRecord"];

export type ResourceStatus = APISchemas["DashboardResourceStatus"];

export type DashboardSnapshot = APISchemas["DashboardResponse"];
