import type { APISchemas } from "@/api/client";

import type { PaginationMeta, PaginationParams } from "./pagination";

export type BuildRunStatus = "failed" | "queued" | "running" | "success";

export type BuildTriggerType = APISchemas["BuildRecord"]["triggerType"];

/** 构建产物可包含的平台目录，取值与拉包接口的 `platform` 参数一致。 */
export type BuildPlatform = APISchemas["ArtifactManifestResponse"]["platform"];

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
  /** 完整 commit SHA，构建检出前为空字符串。 */
  commitSha: string;
  commitShortSha: string;
  /** 代码托管平台上的提交页地址，缺少仓库地址或 commit 时为空字符串。 */
  commitUrl: string;
  createdAt: string;
  createdAtRaw: string;
  /** 手动构建为控制台用户，webhook 构建为代码源连接创建人；历史构建或用户已删除时为 null。 */
  createdBy: APISchemas["UserSummary"] | null;
  duration: string;
  environment: string;
  id: string;
  module: string;
  moduleId: string;
  operator: string;
  platforms: string[];
  repositoryWebUrl: string;
  /** forge.json 中的运行时版本，构建成功前为空字符串。 */
  runtimeVersion: string;
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
