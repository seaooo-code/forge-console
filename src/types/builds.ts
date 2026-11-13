import type { APISchemas } from "@/api/client";

import type { PaginationMeta, PaginationParams } from "./pagination";

export type BuildRunStatus = "canceled" | "failed" | "queued" | "running" | "success";

export type BuildTriggerType = APISchemas["BuildRecord"]["triggerType"];

export type BuildListStatusFilter = "" | APISchemas["BuildRecord"]["status"];

export type BuildListTriggerTypeFilter = "" | BuildTriggerType;

export type BuildListFilters = {
  applicationId: string;
  environment: string;
  moduleId: string;
  status: BuildListStatusFilter;
  triggerType: BuildListTriggerTypeFilter;
};

export type BuildListRequest = BuildListFilters & PaginationParams;

export type BuildRunRecord = {
  application: string;
  artifact: string;
  branch: string;
  commit: string;
  createdAt: string;
  createdAtRaw: string;
  duration: string;
  environment: string;
  id: string;
  module: string;
  moduleId: string;
  operator: string;
  startedAt: string;
  status: BuildRunStatus;
  triggerId: string;
  triggerType: BuildTriggerType;
  version: string;
};

export type BuildsSnapshot = {
  builds: BuildRunRecord[];
  pagination: PaginationMeta;
  summary: {
    failed: number;
    queued: number;
    running: number;
    success: number;
    total: number;
  };
};

export type BuildCreateFormState = {
  branch: string;
  environment: string;
  moduleId: string;
};

export type BuildCreateInput = BuildCreateFormState;

export type BuildCreateResult = {
  createdAt: string;
  id: string;
};
