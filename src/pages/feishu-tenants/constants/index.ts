import type { FeishuTenantFormState, FeishuTenantStatus } from "../types";

export const feishuTenantStatusLabels: Record<FeishuTenantStatus, string> = {
  active: "启用中",
  disabled: "已停用",
};

export const defaultFeishuTenantForm: FeishuTenantFormState = {
  appId: "",
  appSecret: "",
  id: "",
  name: "",
  sortOrder: "0",
  status: "active",
};
