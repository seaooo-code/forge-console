import type { APISchemas } from "@/api/client";

export type CodeSourceApp = APISchemas["CodeSourceApp"];

export type CodeSourceProvider = CodeSourceApp["provider"];

export type CodeSourceAppStatus = CodeSourceApp["status"];

export type CodeSourceAppConfigurationStatus = CodeSourceApp["configurationStatus"];

export type CodeSourceInstallURL = APISchemas["CodeSourceInstallURL"];

export type CodeSourceAppManifest = APISchemas["CodeSourceAppManifest"];

export type CodeSourcesSnapshot = {
  apps: CodeSourceApp[];
};
