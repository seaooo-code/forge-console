export type PipelineDefinitionStatus = "disabled" | "enabled";

export type PipelineStepType = "build" | "deploy" | "notify" | "test" | "upload_artifact";

export type PipelineDefinitionRecord = {
  description: string;
  id: string;
  lastRunAt: string;
  name: string;
  owner: string;
  status: PipelineDefinitionStatus;
  stepCount: number;
  steps: PipelineStepType[];
  triggerMode: string;
  updatedAt: string;
};

export type PipelinesSnapshot = {
  pipelines: PipelineDefinitionRecord[];
  summary: {
    buildEnabled: number;
    deployEnabled: number;
    enabled: number;
    total: number;
  };
};
