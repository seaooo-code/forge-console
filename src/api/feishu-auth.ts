import { apiBaseUrl } from "@/api/client";
import type { AuthSession, FeishuAuthResponse, FeishuLoginTenant, GlobalRole } from "@/types/auth";

const authRedirectStorageKey = "forge-console.auth-redirect-path";
const lastTenantStorageKey = "forge-console.last-feishu-tenant";
const pendingLoginStorageKey = "forge-console.feishu-login-pending";
/** 发起登录后超过这个时间还没回到回调页，就不再认为「上次登录没有完成」。 */
const pendingLoginMaxAgeMs = 30 * 60 * 1000;
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

export type PendingFeishuLogin = {
  /** 本次登录传给飞书的回调地址。 */
  callbackUrl: string;
  tenantId: string;
};

/**
 * 读取「已发起、但没有回到回调页」的登录。飞书对不在白名单里的回调地址会直接展示错误页，不会跳回来，
 * 前端读不到这个错误，只能靠这个标记在用户回到登录页时提示去飞书后台添加域名。到达回调页时标记会被清掉。
 */
export function readPendingFeishuLogin(): PendingFeishuLogin | null {
  const raw = window.sessionStorage.getItem(pendingLoginStorageKey);
  if (!raw) {
    return null;
  }
  try {
    const value = JSON.parse(raw) as {
      callbackUrl?: string;
      startedAt?: number;
      tenantId?: string;
    };
    if (
      value.callbackUrl &&
      typeof value.startedAt === "number" &&
      Date.now() - value.startedAt <= pendingLoginMaxAgeMs
    ) {
      return { callbackUrl: value.callbackUrl, tenantId: value.tenantId ?? "" };
    }
  } catch {
    // 标记损坏时当作没有，下面统一清掉。
  }
  window.sessionStorage.removeItem(pendingLoginStorageKey);
  return null;
}

export function clearPendingFeishuLogin() {
  window.sessionStorage.removeItem(pendingLoginStorageKey);
}

export function beginFeishuAuthorization(redirectPath: string, tenantId: string) {
  window.sessionStorage.setItem(authRedirectStorageKey, normalizeRedirectPath(redirectPath));
  window.localStorage.setItem(lastTenantStorageKey, tenantId);
  // 回调地址按前端自身域名拼出，后端只接受 {origin}/login/feishu/callback，飞书再按应用白名单校验一次。
  const callbackUrl = `${window.location.origin}/login/feishu/callback`;
  window.sessionStorage.setItem(
    pendingLoginStorageKey,
    JSON.stringify({ callbackUrl, startedAt: Date.now(), tenantId }),
  );
  const query = new URLSearchParams({
    redirect: callbackUrl,
    tenant: tenantId,
  });
  window.location.assign(`${apiBaseUrl}/api/v1/auth/feishu/authorize?${query.toString()}`);
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
      canManageTestPlans: Boolean(payload.capabilities?.canManageTestPlans),
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
