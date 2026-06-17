import type { MiCarEnvironmentCode } from "@/types/environments";

export type ReleaseRecordEnvironment = Exclude<MiCarEnvironmentCode, "dev">;

export type ReleaseRecordStatus = "canceled" | "failed" | "queued" | "running" | "success";

export type ReleaseRecordTriggerType = "manual" | "pipeline" | "release_task";

export type ReleasePointerRecord = {
  artifact: string;
  application: string;
  effectiveAt: string;
  environment: ReleaseRecordEnvironment;
  id: string;
  moduleCount: number;
  operator: string;
  startedAt: string;
  status: ReleaseRecordStatus;
  strategy: string;
  triggerId: string;
  triggerType: ReleaseRecordTriggerType;
};

export type ReleaseRecordsSnapshot = {
  records: ReleasePointerRecord[];
  summary: {
    failed: number;
    queued: number;
    running: number;
    success: number;
    total: number;
  };
};
