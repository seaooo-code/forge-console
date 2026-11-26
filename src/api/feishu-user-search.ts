import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";
import type { FeishuUserSearchResult, ResolvedUser } from "@/types/feishu";

type FeishuUserSearchAPIResponse = APISchemas["FeishuUserSearchResponse"];

type FeishuUserSearchAPIResult = APISchemas["FeishuUserSearchItem"];

type ResolvedUserAPIResult = APISchemas["User"];

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
    page_size: "10",
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
    avatarUrl: user.avatarUrl ?? "",
    email: user.email ?? "",
    enName: user.enName ?? "",
    id: openId || userId || unionId,
    name: user.name ?? "",
    openId,
    unionId,
    userId,
  };
}

/** 把通讯录里选中的人写成当前租户的 Forge 用户，返回可以直接提交的用户。 */
export async function resolveFeishuUser(user: FeishuUserSearchResult): Promise<ResolvedUser> {
  const payload = await fetchJSON<{ user: ResolvedUserAPIResult }>("/api/v1/feishu/users", {
    body: JSON.stringify({
      email: user.email,
      enName: user.enName,
      name: user.name,
      openId: user.openId,
      unionId: user.unionId,
      userId: user.userId,
    }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  return normalizeResolvedUser(payload.user);
}

/** 在当前租户已有的用户里搜索。SuperAdmin 进入其他租户时只能从这里选人。 */
export async function searchLocalUsers(query: string): Promise<ResolvedUser[]> {
  const params = new URLSearchParams({ limit: "10", query });
  const payload = await fetchJSON<APISchemas["UsersResponse"]>(
    `/api/v1/users?${params.toString()}`,
  );
  return payload.users.map(normalizeResolvedUser);
}

function normalizeResolvedUser(user: ResolvedUserAPIResult): ResolvedUser {
  return {
    avatarUrl: user.avatarUrl ?? "",
    email: user.email ?? "",
    id: user.id,
    name: user.name,
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

/** OwnerPicker 里的人和已有用户共用一种形态：来源是飞书通讯录时选完要先换成 Forge 用户。 */
export type AssignableUser = {
  avatarUrl: string;
  email: string;
  /** 已经是当前租户的 Forge 用户时直接可用；来自飞书通讯录时是通讯录里的临时 ID，提交前必须换成 Forge 用户。 */
  id: string;
  name: string;
  provider: "feishu" | "local";
};

type AssignableUserWithSource = AssignableUser & { feishu?: FeishuUserSearchResult };

const assignableUserSources = new Map<string, AssignableUserWithSource>();

/**
 * 选人搜索：优先搜飞书通讯录；SuperAdmin 进入其他租户时飞书通讯录不可用（403），退化为搜当前租户已有的用户。
 */
export async function searchAssignableUsers(query: string): Promise<AssignableUser[]> {
  try {
    const users = await searchFeishuUsers(query);
    assignableUserSources.clear();
    const assignable = users.map((user) => {
      const value: AssignableUserWithSource = {
        avatarUrl: user.avatarUrl,
        email: user.email,
        feishu: user,
        id: user.id,
        name: user.name,
        provider: "feishu",
      };
      assignableUserSources.set(value.id, value);
      return value;
    });
    return assignable;
  } catch (error) {
    if (error instanceof FeishuUserSearchAPIError && error.status === 403) {
      const users = await searchLocalUsers(query);
      return users.map((user) => ({ ...user, provider: "local" as const }));
    }
    throw error;
  }
}

/** 把选中的联系人换成当前租户的 Forge 用户。 */
export async function resolveAssignableUser(user: AssignableUser): Promise<ResolvedUser> {
  if (user.provider === "local") {
    return { avatarUrl: user.avatarUrl, email: user.email, id: user.id, name: user.name };
  }
  const source = assignableUserSources.get(user.id)?.feishu;
  if (!source) {
    throw new Error("联系人已失效，请重新搜索");
  }
  return resolveFeishuUser(source);
}
