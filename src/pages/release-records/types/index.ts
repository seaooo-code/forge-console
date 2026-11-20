import type { APISchemas } from "@/api/client";
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
  buildRecordId: string;
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
  /** 发布路由所属的运行时版本，新发布只替换同一运行时版本下的同类发布。 */
  runtimeVersion: string;
  status: ReleaseRecordStatus;
  updatedAt: string;
  updatedAtFull: string;
  updatedAtRaw: string;
};

export type ReleaseRecordDetail = ReleasePointerRecord;

export type ReleaseRecordsSnapshot = {
  pagination: PaginationMeta;
  records: ReleasePointerRecord[];
  summary: {
    active: number;
    inactive: number;
    total: number;
  };
};
