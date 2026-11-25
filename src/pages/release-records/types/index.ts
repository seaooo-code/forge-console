import type { APISchemas } from "@/api/client";
import type { CommitDetail } from "@/types/commits";
import type { PaginationMeta, PaginationParams } from "@/types/pagination";

export type ReleaseRecordStatus = APISchemas["ReleaseRecord"]["status"];

export type ReleaseRecordType = APISchemas["ReleaseRecord"]["releaseType"];

export type EnvironmentTone = APISchemas["Environment"]["tone"];

export type ReleaseGrayStrategy = NonNullable<APISchemas["ReleaseRecord"]["grayStrategy"]>;

export type ReleaseRecordsFilters = {
  applicationId: string;
  environment: string;
  moduleId: string;
  releaseType: ReleaseRecordType | "";
  status: ReleaseRecordStatus | "";
};

export type ReleaseRecordsRequest = ReleaseRecordsFilters & PaginationParams;

export type ReleasePointerRecord = {
  artifact: string;
  artifactKey: string;
  artifactUrl: string;
  application: string;
  /** 发布使用的构建的分支，构建被删除时为空字符串。 */
  buildBranch: string;
  /** 发布使用的构建的构建号，构建被删除时为 0。 */
  buildNumber: number;
  buildRecordId: string;
  /** 发布使用的构建的提交。 */
  commit: CommitDetail;
  /** 发布所属的渠道，默认渠道为空字符串。 */
  channel: string;
  createdAt: string;
  createdAtRaw: string;
  createdAtShort: string;
  createdByUserId: string;
  description: string;
  environment: string;
  environmentName: string;
  /** 历史定向灰度的过期时间，新发布不再产生。 */
  expiresAt: string;
  id: string;
  grayPercentage: number;
  grayStrategy: ReleaseGrayStrategy;
  module: string;
  moduleId: string;
  operator: string;
  releaseType: ReleaseRecordType;
  /** 发布路由所属的运行时版本，新发布只影响同一运行时版本下的发布。 */
  runtimeVersion: string;
  status: ReleaseRecordStatus;
  /** 最近一次健康判定的结果，策略没开、没判定过时为空字符串。 */
  healthStatus: APISchemas["ReleaseRecord"]["healthStatus"];
  updatedAt: string;
  updatedAtFull: string;
  updatedAtRaw: string;
};

export type ReleaseRecordDetail = ReleasePointerRecord;

export type ReleaseEvent = {
  /** 操作人姓名，系统操作或用户已删除时为「系统」。 */
  actor: string;
  createdAt: string;
  detail: APISchemas["ReleaseEvent"]["detail"];
  id: number;
  kind: APISchemas["ReleaseEvent"]["kind"];
};

export type ReleaseHealth = APISchemas["ReleaseHealthResponse"];

export type ReleasePullStats = {
  /** 按日期倒序，只包含有请求的日期。 */
  days: { day: string; platforms: Record<string, number>; total: number }[];
  total: number;
};

export type ReleaseRecordsSnapshot = {
  pagination: PaginationMeta;
  records: ReleasePointerRecord[];
  summary: {
    active: number;
    inactive: number;
    total: number;
  };
};
