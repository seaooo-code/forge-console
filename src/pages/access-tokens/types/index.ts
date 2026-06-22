export type ArtifactAccessTokenStatus = "active" | "disabled";

export type ArtifactAccessTokenRecord = {
  createdAt: string;
  createdBy: string;
  expiresAt: string;
  id: string;
  lastUsedAt: string;
  name: string;
  status: ArtifactAccessTokenStatus;
  tokenPreview: string;
};

export type AccessTokensSnapshot = {
  tokens: ArtifactAccessTokenRecord[];
};

export type ArtifactAccessTokenCreateInput = {
  expiresAt?: string;
  name: string;
  token: string;
};

export type ArtifactAccessTokenGenerateResult = {
  plainToken: string;
};
