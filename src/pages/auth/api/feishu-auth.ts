import type { AuthSession, FeishuAuthResponse } from "../types";

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);
const authRedirectStorageKey = "forge-console.auth-redirect-path";
const authorizationRequests = new Map<string, Promise<AuthSession>>();

export function beginFeishuAuthorization(redirectPath: string) {
  window.sessionStorage.setItem(authRedirectStorageKey, normalizeRedirectPath(redirectPath));
  window.location.assign(`${apiBaseUrl}/api/v1/auth/feishu/authorize`);
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

  return {
    authorizedAt: new Date().toISOString(),
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
