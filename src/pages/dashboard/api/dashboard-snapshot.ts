import type { DashboardSnapshot } from "../types";

export const dashboardSnapshotQueryKey = ["dashboard-snapshot"] as const;

type APIErrorPayload = {
  error?: string;
};

export class DashboardAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(getDashboardAPIErrorMessage(path, status, payload));
    this.name = "DashboardAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const dashboardAPIErrorMessages: Record<string, string> = {
  "dashboard service unavailable": "仪表盘服务暂不可用",
  "internal server error": "服务端内部错误，请稍后重试",
  unauthorized: "登录状态已失效，请重新登录",
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  return fetchJSON<DashboardSnapshot>("/api/v1/dashboard");
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
    throw new DashboardAPIError(path, response.status, payload);
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

function getDashboardAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  const error = payload?.error;
  if (error) {
    return dashboardAPIErrorMessages[error] ?? error;
  }
  if (status === 401) {
    return dashboardAPIErrorMessages.unauthorized;
  }
  return `Request ${path} failed with ${status}`;
}
