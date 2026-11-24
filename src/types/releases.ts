import type { APISchemas } from "@/api/client";

export type BuildReleaseType = APISchemas["ReleaseCreateRequest"]["releaseType"];

export type BuildReleaseFormState = {
  /** 发布渠道，空字符串表示默认渠道。 */
  channel: string;
  grayPercentage: number;
  releaseType: BuildReleaseType;
};

export type BuildReleaseInput = BuildReleaseFormState & {
  buildRecordId: string;
};
