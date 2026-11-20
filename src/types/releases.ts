import type { APISchemas } from "@/api/client";

export type BuildReleaseType = APISchemas["ReleaseCreateRequest"]["releaseType"];

export type BuildReleaseFormState = {
  grayPercentage: number;
  releaseType: BuildReleaseType;
};

export type BuildReleaseInput = BuildReleaseFormState & {
  buildRecordId: string;
};
