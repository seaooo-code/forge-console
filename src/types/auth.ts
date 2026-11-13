import type { APISchemas } from "@/api/client";

export type AuthUser = APISchemas["FeishuUser"];

export type AuthTokenMeta = APISchemas["FeishuToken"];

export type GlobalRole = "SuperAdmin" | "PlatformAdmin" | "ReleaseAdmin" | "Auditor";

export type GlobalCapabilities = APISchemas["GlobalCapabilities"];

export type AuthSession = {
  authorizedAt: string;
  capabilities: GlobalCapabilities;
  roles: GlobalRole[];
  token: AuthTokenMeta;
  user: AuthUser;
};

export type FeishuAuthResponse = APISchemas["FeishuAuthResponse"];
