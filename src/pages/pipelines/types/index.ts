export type PipelineStatus = "canceled" | "failed" | "queued" | "running" | "success";

export type PipelineStepStatus = "done" | "pending" | "running";

export type PipelineRecord = {
  branch: string;
  commit: string;
  duration: string;
  executor: string;
  id: string;
  module: string;
  startedAt: string;
  status: PipelineStatus;
  task: string;
};

export type PipelineStep = {
  duration: string;
  id: string;
  label: string;
  status: PipelineStepStatus;
};

export type CurrentPipelineRun = {
  branch: string;
  duration: string;
  id: string;
  module: string;
  statusText: string;
  steps: PipelineStep[];
};

export type PipelinesSnapshot = {
  currentRun: CurrentPipelineRun;
  pipelines: PipelineRecord[];
};
