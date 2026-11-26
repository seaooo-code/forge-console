import type { APISchemas } from "@/api/client";

export type Tenant = APISchemas["Tenant"];

export type TenantStatus = Tenant["status"];

export type TenantCreateInput = APISchemas["TenantCreateRequest"];

export type TenantUpdateInput = APISchemas["TenantUpdateRequest"];

export type TenantFormState = {
  feishuAppId: string;
  feishuAppSecret: string;
  id: string;
  name: string;
  sortOrder: string;
  status: TenantStatus;
};
