export type CodeSourceProvider = "github";

export type CodeSourceAppStatus = "installed" | "notInstalled";

export type CodeSourceApp = {
  description: string;
  id: CodeSourceProvider;
  installedAt?: string;
  name: string;
  provider: CodeSourceProvider;
  status: CodeSourceAppStatus;
};

export type CodeSourcesSnapshot = {
  apps: CodeSourceApp[];
};
