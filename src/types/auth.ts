import type { APISchemas } from "@/api/client";

export type AuthUser = APISchemas["FeishuUser"];

export type AuthTokenMeta = APISchemas["FeishuToken"];

export type GlobalRole = "SuperAdmin" | "PlatformAdmin" | "ReleaseAdmin" | "Auditor";

export type GlobalCapabilities = APISchemas["GlobalCapabilities"];

/** 登录页可选的飞书租户，只有 ID 和名称。 */
export type FeishuLoginTenant = APISchemas["FeishuLoginTenant"];

export type AuthSession = {
  authorizedAt: string;
  capabilities: GlobalCapabilities;
  roles: GlobalRole[];
  /** 本次登录使用的飞书租户。 */
  tenant: FeishuLoginTenant;
  token: AuthTokenMeta;
  user: AuthUser;
};

export type FeishuAuthResponse = APISchemas["FeishuAuthResponse"];
