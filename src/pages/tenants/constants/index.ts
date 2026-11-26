import type { TenantFormState, TenantStatus } from "../types";

export const tenantStatusLabels: Record<TenantStatus, string> = {
  active: "启用中",
  disabled: "已停用",
};

export const defaultTenantForm: TenantFormState = {
  feishuAppId: "",
  feishuAppSecret: "",
  id: "",
  name: "",
  sortOrder: "0",
  status: "active",
};
