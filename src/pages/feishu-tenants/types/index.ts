import type { APISchemas } from "@/api/client";

export type FeishuTenant = APISchemas["FeishuTenant"];

export type FeishuTenantStatus = FeishuTenant["status"];

export type FeishuTenantCreateInput = APISchemas["FeishuTenantCreateRequest"];

export type FeishuTenantUpdateInput = APISchemas["FeishuTenantUpdateRequest"];

export type FeishuTenantFormState = {
  appId: string;
  appSecret: string;
  id: string;
  name: string;
  sortOrder: string;
  status: FeishuTenantStatus;
};
