import type { FeishuUserSearchResult } from "@/types/feishu";

type FeishuUserSearchAPIResponse = {
  users: FeishuUserSearchAPIResult[];
};

type APIErrorPayload = {
  error?: string;
  feishuCode?: number;
  feishuEndpoint?: string;
  feishuMsg?: string;
};

type FeishuUserSearchAPIResult = Omit<FeishuUserSearchResult, "id"> & {
  id?: string;
};

export class FeishuUserSearchAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(buildAPIErrorMessage(path, status, payload));
    this.name = "FeishuUserSearchAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

export async function searchFeishuUsers(query: string): Promise<FeishuUserSearchResult[]> {
  const params = new URLSearchParams({
    pageSize: "10",
    query,
  });
  const payload = await fetchJSON<FeishuUserSearchAPIResponse>(
    `/api/v1/feishu/users/search?${params.toString()}`,
  );

  return payload.users.map(normalizeFeishuUserSearchResult);
}

function normalizeFeishuUserSearchResult(
  user: FeishuUserSearchAPIResult,
): FeishuUserSearchResult {
  return {
    ...user,
    departmentIds: user.departmentIds ?? [],
    id: user.id || user.openId || user.userId || user.unionId,
  };
}

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw new FeishuUserSearchAPIError(path, response.status, payload);
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

function buildAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  if (payload?.feishuMsg) {
    return payload.feishuCode
      ? `飞书错误 ${payload.feishuCode}: ${payload.feishuMsg}`
      : payload.feishuMsg;
  }
  if (payload?.error) {
    return payload.error;
  }
  return `Request ${path} failed with ${status}`;
}
