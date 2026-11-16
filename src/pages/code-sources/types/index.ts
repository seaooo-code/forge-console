import type { APISchemas } from "@/api/client";

export type CodeSourceApp = APISchemas["CodeSourceApp"];

export type CodeSourceInstallURL = APISchemas["CodeSourceInstallURL"];

export type CodeSourceAppManifest = APISchemas["CodeSourceAppManifest"];

export type CodeSourceConnection = APISchemas["CodeSourceConnection"];

export type CodeSourceConnectionProvider = CodeSourceConnection["provider"];

export type CodeSourceConnectionStatus = CodeSourceConnection["status"];

export type CodeSourceConnectionCreateRequest = APISchemas["CodeSourceConnectionCreateRequest"];

export type CodeSourceConnectionUpdateRequest = APISchemas["CodeSourceConnectionUpdateRequest"];

export type CodeSourcesSnapshot = {
  apps: CodeSourceApp[];
};

/** 凭证过期提示级别：expired 已过期，expiring 在提示窗口内即将过期。 */
export type CredentialExpiryLevel = "expired" | "expiring" | "none";

export type GitLabConnectionFormValues = {
  credential: string;
  name: string;
  webBaseUrl: string;
};

/** 连接行上正在执行的操作，用于按行禁用按钮和展示进行中文案。 */
export type CodeSourceConnectionAction = "delete" | "status" | "verify";
