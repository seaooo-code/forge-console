import { apiBaseUrl } from "@/api/client";
import type { AuthSession, FeishuAuthResponse, FeishuLoginTenant, GlobalRole } from "@/types/auth";

const authRedirectStorageKey = "forge-console.auth-redirect-path";
const lastTenantStorageKey = "forge-console.last-feishu-tenant";
const authorizationRequests = new Map<string, Promise<AuthSession>>();
let sessionRequest: Promise<AuthSession | null> | null = null;

/** 登录页可选的飞书租户，接口不需要登录。 */
export async function fetchLoginTenants(): Promise<FeishuLoginTenant[]> {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/feishu/tenants`, {
    credentials: "include",
  });
  if (!response.ok) {
    const errorMessage = await readErrorMessage(response);
    throw new Error(errorMessage || `读取登录租户失败：${response.status}`);
  }
  const payload = (await response.json()) as { tenants: FeishuLoginTenant[] };
  return payload.tenants;
}

export function readLastLoginTenant() {
  return window.localStorage.getItem(lastTenantStorageKey) ?? "";
}

export function beginFeishuAuthorization(redirectPath: string, tenantId: string) {
  window.sessionStorage.setItem(authRedirectStorageKey, normalizeRedirectPath(redirectPath));
  window.localStorage.setItem(lastTenantStorageKey, tenantId);
  window.location.assign(
    `${apiBaseUrl}/api/v1/auth/feishu/authorize?tenant=${encodeURIComponent(tenantId)}`,
  );
}

export async function fetchAuthSession(): Promise<AuthSession | null> {
  if (sessionRequest) {
    return sessionRequest;
  }

  sessionRequest = requestAuthSession().finally(() => {
    sessionRequest = null;
  });
  return sessionRequest;
}

async function requestAuthSession(): Promise<AuthSession | null> {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/session`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    const errorMessage = await readErrorMessage(response);
    throw new Error(errorMessage || `读取登录态失败：${response.status}`);
  }

  return toAuthSession((await response.json()) as FeishuAuthResponse);
}

export async function logoutAuthSession() {
  const response = await fetch(`${apiBaseUrl}/api/v1/auth/logout`, {
    credentials: "include",
    method: "POST",
  });

  if (!response.ok && response.status !== 401) {
    const errorMessage = await readErrorMessage(response);
    throw new Error(errorMessage || `退出登录失败：${response.status}`);
  }
}

export async function completeFeishuAuthorization(
  code: string,
  state: string,
): Promise<AuthSession> {
  const requestKey = `${code}:${state}`;
  const cachedRequest = authorizationRequests.get(requestKey);
  if (cachedRequest) {
    return cachedRequest;
  }

  const request = exchangeFeishuAuthorization(code, state);
  authorizationRequests.set(requestKey, request);
  return request;
}

async function exchangeFeishuAuthorization(code: string, state: string): Promise<AuthSession> {
  // 同域部署时 apiBaseUrl 为空字符串，用当前页面地址做基准解析相对路径。
  const callbackURL = new URL(`${apiBaseUrl}/api/v1/auth/feishu/callback`, window.location.origin);
  callbackURL.searchParams.set("code", code);
  callbackURL.searchParams.set("state", state);

  const response = await fetch(callbackURL, {
    credentials: "include",
  });

  if (!response.ok) {
    const errorMessage = await readErrorMessage(response);
    throw new Error(errorMessage || `飞书登录失败：${response.status}`);
  }

  const payload = (await response.json()) as FeishuAuthResponse;

  return toAuthSession(payload);
}

function toAuthSession(payload: FeishuAuthResponse): AuthSession {
  return {
    authorizedAt: new Date().toISOString(),
    capabilities: {
      canCreateApplication: Boolean(payload.capabilities?.canCreateApplication),
      canManageAccessTokens: Boolean(payload.capabilities?.canManageAccessTokens),
      canManageApplications: Boolean(payload.capabilities?.canManageApplications),
      canManageBuildAdapters: Boolean(payload.capabilities?.canManageBuildAdapters),
      canManageCodeSources: Boolean(payload.capabilities?.canManageCodeSources),
      canManageEnvironments: Boolean(payload.capabilities?.canManageEnvironments),
      canManageFeishuTenants: Boolean(payload.capabilities?.canManageFeishuTenants),
      canManageModules: Boolean(payload.capabilities?.canManageModules),
      canManageStorage: Boolean(payload.capabilities?.canManageStorage),
      canCreateBuild: Boolean(payload.capabilities?.canCreateBuild),
      canCreateRelease: Boolean(payload.capabilities?.canCreateRelease),
    },
    roles: (payload.roles ?? []) as GlobalRole[],
    tenant: payload.tenant ?? { id: "", name: "" },
    token: payload.token,
    user: payload.user,
  };
}

export function takeStoredAuthRedirectPath() {
  const redirectPath = window.sessionStorage.getItem(authRedirectStorageKey);
  window.sessionStorage.removeItem(authRedirectStorageKey);
  return normalizeRedirectPath(redirectPath || "/");
}

function normalizeRedirectPath(path: string) {
  if (!path?.startsWith("/") || path.startsWith("//") || path.startsWith("/login")) {
    return "/";
  }

  return path;
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || "";
  } catch {
    return "";
  }
}
