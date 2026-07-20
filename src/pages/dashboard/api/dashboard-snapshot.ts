import { type APIErrorPayload, createFetchClient } from "@/api/client";
import type { DashboardSnapshot } from "../types";

export const dashboardSnapshotQueryKey = ["dashboard-snapshot"] as const;

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

const fetchJSON = createFetchClient(
  (path, status, payload) => new DashboardAPIError(path, status, payload),
);

const dashboardAPIErrorMessages: Record<string, string> = {
  "dashboard service unavailable": "仪表盘服务暂不可用",
  "internal server error": "服务端内部错误，请稍后重试",
  unauthorized: "登录状态已失效，请重新登录",
};

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  return fetchJSON<DashboardSnapshot>("/api/v1/dashboard");
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
