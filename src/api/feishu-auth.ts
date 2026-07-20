import { apiBaseUrl } from "@/api/client";
import type { AuthSession, FeishuAuthResponse } from "@/types/auth";

const authRedirectStorageKey = "forge-console.auth-redirect-path";
const authorizationRequests = new Map<string, Promise<AuthSession>>();
let sessionRequest: Promise<AuthSession | null> | null = null;

export function beginFeishuAuthorization(redirectPath: string) {
  window.sessionStorage.setItem(authRedirectStorageKey, normalizeRedirectPath(redirectPath));
  window.location.assign(`${apiBaseUrl}/api/v1/auth/feishu/authorize`);
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
  const callbackURL = new URL(`${apiBaseUrl}/api/v1/auth/feishu/callback`);
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
      canManageCodeSources: Boolean(payload.capabilities?.canManageCodeSources),
      canManageEnvironments: Boolean(payload.capabilities?.canManageEnvironments),
      canManageModules: Boolean(payload.capabilities?.canManageModules),
      canManageStorage: Boolean(payload.capabilities?.canManageStorage),
      canCreateBuild: Boolean(payload.capabilities?.canCreateBuild),
      canCreateRelease: Boolean(payload.capabilities?.canCreateRelease),
    },
    roles: payload.roles ?? [],
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
