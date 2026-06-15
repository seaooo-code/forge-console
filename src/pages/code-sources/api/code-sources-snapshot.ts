import type { CodeSourcesSnapshot } from "../types";

export const codeSourcesSnapshotQueryKey = ["code-sources-snapshot"] as const;

const codeSourcesSnapshot: CodeSourcesSnapshot = {
  apps: [
    {
      description: "安装后可读取 GitHub Organization 下授权仓库，用于后续仓库绑定。",
      id: "github",
      installedAt: "2026-06-10 11:24",
      name: "GitHub App",
      provider: "github",
      status: "installed",
    },
  ],
};

export async function fetchCodeSourcesSnapshot(): Promise<CodeSourcesSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return codeSourcesSnapshot;
}
