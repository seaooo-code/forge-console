export type BuildReleaseType = "full" | "gray";

export type BuildReleaseGrayStrategy = "percentage" | "targeted";

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
