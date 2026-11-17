import type {
  ApplicationDetailMetric,
  ApplicationEnvironmentRecord,
  ApplicationEnvironmentStatus,
  ApplicationEnvironmentStatusCode,
  ApplicationListFilters,
  ApplicationModuleRecord,
  ApplicationStatus,
  ApplicationStatusCode,
} from "../types";

export const applicationStatusCodes: ReadonlySet<ApplicationStatusCode> = new Set([
  "running",
  "maintenance",
  "offline",
]);

export const applicationStatusCodeByLabel: Record<ApplicationStatus, ApplicationStatusCode> = {
  已下线: "offline",
  维护中: "maintenance",
  运行中: "running",
};

export const applicationStatusLabelByCode: Record<ApplicationStatusCode, ApplicationStatus> = {
  maintenance: "维护中",
  offline: "已下线",
  running: "运行中",
};

export const emptyApplicationListFilters: ApplicationListFilters = {
  keyword: "",
  owner: "",
  platform: "",
  status: "",
};

export const applicationStatusClass: Record<ApplicationStatus, string> = {
  已下线: "bg-muted text-muted-foreground",
  维护中: "bg-warning/14 text-warning",
  运行中: "bg-success/12 text-success",
};

export const applicationMetricToneClass: Record<ApplicationDetailMetric["tone"], string> = {
  amber: "bg-warning/10 text-warning",
  blue: "bg-info/10 text-info",
  emerald: "bg-success/10 text-success",
  rose: "bg-destructive/10 text-destructive",
  slate: "bg-muted text-muted-foreground",
};

export const applicationEnvironmentStatusClass: Record<
  ApplicationEnvironmentRecord["status"],
  string
> = {
  健康: "bg-success/12 text-success",
  灰度中: "bg-warning/14 text-warning",
  维护中: "bg-muted text-muted-foreground",
};

export const applicationEnvironmentStatusLabelByCode: Record<
  ApplicationEnvironmentStatusCode,
  ApplicationEnvironmentStatus
> = {
  gray: "灰度中",
  healthy: "健康",
  maintenance: "维护中",
};

export const applicationModuleKindClass: Record<ApplicationModuleRecord["kind"], string> = {
  Common: "bg-warning/14 text-warning",
  Feature: "bg-info-soft text-info",
};
