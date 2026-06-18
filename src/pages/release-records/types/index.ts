export type ReleaseRecordStatus = "active" | "inactive" | "revoked";

export type ReleaseRecordType = "full" | "targeted";

export type ReleaseRecordsFilters = {
  environment?: string;
  moduleId?: string;
};

export type ReleasePointerRecord = {
  artifact: string;
  application: string;
  buildRecordId: string;
  createdAt: string;
  environment: string;
  environmentName: string;
  id: string;
  identifier: string;
  module: string;
  moduleId: string;
  operator: string;
  releaseType: ReleaseRecordType;
  status: ReleaseRecordStatus;
  updatedAt: string;
};

export type ReleaseRecordsSnapshot = {
  records: ReleasePointerRecord[];
  summary: {
    active: number;
    inactive: number;
    revoked: number;
    total: number;
  };
};
