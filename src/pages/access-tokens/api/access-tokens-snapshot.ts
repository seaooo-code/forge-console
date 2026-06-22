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

type APIErrorPayload = {
  error?: string;
};

export class AccessTokensAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(payload?.error || `Request ${path} failed with ${status}`);
    this.name = "AccessTokensAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

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

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    ...init,
    headers: init?.body
      ? {
          "Content-Type": "application/json",
          ...init.headers,
        }
      : init?.headers,
  });

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw new AccessTokensAPIError(path, response.status, payload);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readErrorPayload(response: Response): Promise<APIErrorPayload | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  try {
    return (await response.json()) as APIErrorPayload;
  } catch (_error) {
    return undefined;
  }
}
