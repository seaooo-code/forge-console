import type { APISchemas } from "@/api/client";

export type BuildReleaseType = APISchemas["ReleaseCreateRequest"]["releaseType"];

export type BuildReleaseGrayStrategy = Exclude<
  APISchemas["ReleaseCreateRequest"]["grayStrategy"],
  "" | undefined
>;

export type BuildReleaseFormState = {
  expiresAt: string;
  grayPercentage: number;
  grayStrategy: BuildReleaseGrayStrategy;
  identifier: string;
  releaseType: BuildReleaseType;
};

export type BuildReleaseInput = BuildReleaseFormState & {
  buildRecordId: string;
};
