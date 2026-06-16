export type CodeSourceProvider = "github";

export type CodeSourceAppStatus = "installed" | "notInstalled";

export type CodeSourceAppConfigurationStatus = "configured" | "notConfigured";

export type CodeSourceApp = {
  configurationStatus: CodeSourceAppConfigurationStatus;
  description: string;
  id: CodeSourceProvider;
  installedAt?: string;
  name: string;
  provider: CodeSourceProvider;
  status: CodeSourceAppStatus;
};

export type CodeSourceInstallURL = {
  url: string;
};

export type CodeSourceAppManifest = {
  actionUrl: string;
  manifest: string;
};

export type CodeSourcesSnapshot = {
  apps: CodeSourceApp[];
};
