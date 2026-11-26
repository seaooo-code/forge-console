import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";

import type { Tenant, TenantCreateInput, TenantUpdateInput } from "../types";

export const tenantsQueryKey = ["tenants"] as const;

type TenantsAPIResponse = APISchemas["TenantsResponse"];

type TenantDetailAPIResponse = APISchemas["TenantDetailResponse"];

const tenantAPIErrorMessages: Record<string, string> = {
  "at least one tenant must stay active": "至少要保留一个启用中的租户，否则没人能登录",
  "feishu app id already used by another tenant": "这个 App ID 已经被其他租户使用",
  "tenant id already exists": "租户 ID 已存在",
  "tenant not found": "租户不存在",
  forbidden: "只有 SuperAdmin 可以管理租户",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid tenant request": "租户参数无效，请检查表单",
};

export class TenantAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    const error = payload?.error;
    super(
      error ? (tenantAPIErrorMessages[error] ?? error) : `Request ${path} failed with ${status}`,
    );
    this.name = "TenantAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new TenantAPIError(path, status, payload),
);

export async function fetchTenants(): Promise<Tenant[]> {
  const payload = await fetchJSON<TenantsAPIResponse>("/api/v1/tenants");
  return payload.tenants;
}

export async function createTenant(input: TenantCreateInput): Promise<Tenant> {
  const payload = await fetchJSON<TenantDetailAPIResponse>("/api/v1/tenants", {
    body: JSON.stringify(input),
    method: "POST",
  });
  return payload.tenant;
}

export async function updateTenant(tenantId: string, input: TenantUpdateInput): Promise<Tenant> {
  const payload = await fetchJSON<TenantDetailAPIResponse>(
    `/api/v1/tenants/${encodeURIComponent(tenantId)}`,
    { body: JSON.stringify(input), method: "PATCH" },
  );
  return payload.tenant;
}
