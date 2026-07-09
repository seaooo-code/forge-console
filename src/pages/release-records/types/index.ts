export type ReleaseRecordStatus = "active" | "inactive";

export type ReleaseRecordType = "full" | "gray";

export type ReleaseGrayStrategy = "" | "percentage" | "targeted";

export type ReleaseRecordsFilters = {
  environment: string;
  moduleId: string;
  releaseType: ReleaseRecordType | "";
  status: ReleaseRecordStatus | "";
};

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
  records: ReleasePointerRecord[];
  summary: {
    active: number;
    inactive: number;
    total: number;
  };
};
