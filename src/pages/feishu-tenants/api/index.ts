import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";

import type { FeishuTenant, FeishuTenantCreateInput, FeishuTenantUpdateInput } from "../types";

export const feishuTenantsQueryKey = ["feishu-tenants"] as const;

type FeishuTenantsAPIResponse = APISchemas["FeishuTenantsResponse"];

type FeishuTenantDetailAPIResponse = APISchemas["FeishuTenantDetailResponse"];

const feishuTenantAPIErrorMessages: Record<string, string> = {
  "at least one feishu tenant must stay active": "至少要保留一个启用中的租户，否则没人能登录",
  "feishu tenant app id already exists": "这个 App ID 已经被其他租户使用",
  "feishu tenant id already exists": "租户 ID 已存在",
  "feishu tenant not found": "租户不存在",
  forbidden: "只有 SuperAdmin 可以管理飞书租户",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid feishu tenant request": "租户参数无效，请检查表单",
};

export class FeishuTenantAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    const error = payload?.error;
    super(
      error
        ? (feishuTenantAPIErrorMessages[error] ?? error)
        : `Request ${path} failed with ${status}`,
    );
    this.name = "FeishuTenantAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new FeishuTenantAPIError(path, status, payload),
);

export async function fetchFeishuTenants(): Promise<FeishuTenant[]> {
  const payload = await fetchJSON<FeishuTenantsAPIResponse>("/api/v1/feishu-tenants");
  return payload.tenants;
}

export async function createFeishuTenant(input: FeishuTenantCreateInput): Promise<FeishuTenant> {
  const payload = await fetchJSON<FeishuTenantDetailAPIResponse>("/api/v1/feishu-tenants", {
    body: JSON.stringify(input),
    method: "POST",
  });
  return payload.tenant;
}

export async function updateFeishuTenant(
  tenantId: string,
  input: FeishuTenantUpdateInput,
): Promise<FeishuTenant> {
  const payload = await fetchJSON<FeishuTenantDetailAPIResponse>(
    `/api/v1/feishu-tenants/${encodeURIComponent(tenantId)}`,
    { body: JSON.stringify(input), method: "PATCH" },
  );
  return payload.tenant;
}
