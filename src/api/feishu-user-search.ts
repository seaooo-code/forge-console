import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";
import type { FeishuUserSearchResult } from "@/types/feishu";

type FeishuUserSearchAPIResponse = APISchemas["FeishuUserSearchResponse"];

type FeishuUserSearchAPIResult = APISchemas["FeishuUserSearchItem"];

type FeishuUserSearchAPIErrorPayload = APIErrorPayload & {
  feishuCode?: number;
  feishuEndpoint?: string;
  feishuMsg?: string;
};

export class FeishuUserSearchAPIError extends Error {
  readonly payload?: FeishuUserSearchAPIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: FeishuUserSearchAPIErrorPayload) {
    super(buildAPIErrorMessage(path, status, payload));
    this.name = "FeishuUserSearchAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new FeishuUserSearchAPIError(path, status, payload),
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

function normalizeFeishuUserSearchResult(user: FeishuUserSearchAPIResult): FeishuUserSearchResult {
  const openId = user.openId ?? "";
  const userId = user.userId ?? "";
  const unionId = user.unionId ?? "";

  return {
    ...user,
    avatarUrl: user.avatarUrl ?? "",
    departmentIds: user.departmentIds ?? [],
    email: user.email ?? "",
    enName: user.enName ?? "",
    id: openId || userId || unionId,
    mobile: user.mobile ?? "",
    name: user.name ?? "",
    openId,
    unionId,
    userId,
  };
}

function buildAPIErrorMessage(
  path: string,
  status: number,
  payload?: FeishuUserSearchAPIErrorPayload,
) {
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
