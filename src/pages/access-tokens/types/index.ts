import type { APISchemas } from "@/api/client";

export type ArtifactAccessTokenStatus = APISchemas["ArtifactAccessToken"]["status"];

export type ArtifactAccessTokenRecord = APISchemas["ArtifactAccessToken"];

export type AccessTokensSnapshot = {
  tokens: ArtifactAccessTokenRecord[];
};

export type ArtifactAccessTokenCreateInput = APISchemas["ArtifactAccessTokenCreateRequest"];

export type ArtifactAccessTokenGenerateResult = APISchemas["ArtifactAccessTokenGenerateResponse"];
