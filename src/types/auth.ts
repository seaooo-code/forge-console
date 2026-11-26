import type { APISchemas } from "@/api/client";

/** 当前租户里的用户。ID 由后端生成，和飞书身份解耦。 */
export type AuthUser = APISchemas["User"];

export type AuthTokenMeta = APISchemas["SessionToken"];

export type Role = "SuperAdmin" | "TenantAdmin" | "ReleaseAdmin" | "Auditor";

export type GlobalCapabilities = APISchemas["TenantCapabilities"];

/** 登录页可选的租户，只有 ID 和名称。 */
export type LoginTenant = APISchemas["TenantSummary"];

export type AuthSession = {
  authorizedAt: string;
  capabilities: GlobalCapabilities;
  roles: Role[];
  /** 用户所属租户。 */
  homeTenant: LoginTenant;
  /** 当前所在租户。只有 SuperAdmin 切换后和 homeTenant 不同。 */
  activeTenant: LoginTenant;
  token: AuthTokenMeta;
  user: AuthUser;
};

export type AuthSessionResponse = APISchemas["AuthSessionResponse"];

export type Tenant = APISchemas["Tenant"];
