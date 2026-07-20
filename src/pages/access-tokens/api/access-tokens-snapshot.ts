import { type APIErrorPayload, createFetchClient } from "@/api/client";
import type {
  AccessTokensSnapshot,
  ArtifactAccessTokenCreateInput,
  ArtifactAccessTokenGenerateResult,
  ArtifactAccessTokenRecord,
  ArtifactAccessTokenStatus,
} from "../types";

export const accessTokensSnapshotQueryKey = ["access-tokens"] as const;

type ArtifactAccessTokensAPIResponse = {
  tokens: ArtifactAccessTokenRecord[];
};

type ArtifactAccessTokenDetailAPIResponse = {
  token: ArtifactAccessTokenRecord;
};

type ArtifactAccessTokenGenerateAPIResponse = ArtifactAccessTokenGenerateResult;

export class AccessTokensAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(getAccessTokensAPIErrorMessage(path, status, payload));
    this.name = "AccessTokensAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new AccessTokensAPIError(path, status, payload),
  { allowEmpty: true },
);

const accessTokensAPIErrorMessages: Record<string, string> = {
  "artifact access token already exists": "访问令牌已存在，请重新生成",
  "artifact access token not found": "访问令牌不存在",
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid artifact access token request": "访问令牌参数无效，请检查表单",
};

export async function fetchAccessTokensSnapshot(): Promise<AccessTokensSnapshot> {
  const payload = await fetchJSON<ArtifactAccessTokensAPIResponse>(
    "/api/v1/artifact-access-tokens",
  );

  return {
    tokens: payload.tokens,
  };
}

export async function createArtifactAccessToken(
  input: ArtifactAccessTokenCreateInput,
): Promise<ArtifactAccessTokenRecord> {
  const payload = await fetchJSON<ArtifactAccessTokenDetailAPIResponse>(
    "/api/v1/artifact-access-tokens",
    {
      body: JSON.stringify(input),
      method: "POST",
    },
  );

  return payload.token;
}

export async function generateArtifactAccessToken(): Promise<string> {
  const payload = await fetchJSON<ArtifactAccessTokenGenerateAPIResponse>(
    "/api/v1/artifact-access-tokens/generate",
    {
      method: "POST",
    },
  );

  return payload.plainToken;
}

export async function updateArtifactAccessTokenStatus(
  tokenId: string,
  status: ArtifactAccessTokenStatus,
): Promise<ArtifactAccessTokenRecord> {
  const payload = await fetchJSON<ArtifactAccessTokenDetailAPIResponse>(
    `/api/v1/artifact-access-tokens/${encodeURIComponent(tokenId)}`,
    {
      body: JSON.stringify({ status }),
      method: "PATCH",
    },
  );

  return payload.token;
}

export async function deleteArtifactAccessToken(tokenId: string): Promise<void> {
  await fetchJSON<void>(`/api/v1/artifact-access-tokens/${encodeURIComponent(tokenId)}`, {
    method: "DELETE",
  });
}

function getAccessTokensAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  const error = payload?.error;
  if (error) {
    return accessTokensAPIErrorMessages[error] ?? error;
  }
  return `Request ${path} failed with ${status}`;
}
