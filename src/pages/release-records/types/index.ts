import type { APISchemas } from "@/api/client";
import type { PaginationMeta, PaginationParams } from "@/types/pagination";

export type ReleaseRecordStatus = APISchemas["ReleaseRecord"]["status"];

export type ReleaseRecordType = APISchemas["ReleaseRecord"]["releaseType"];

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
  expiresAt: string;
  expiresAtRaw: string;
  expiresAtShort: string;
  id: string;
  grayPercentage: number;
  grayStrategy: ReleaseGrayStrategy;
  identifier: string;
  module: string;
  moduleId: string;
  operator: string;
  releaseType: ReleaseRecordType;
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
