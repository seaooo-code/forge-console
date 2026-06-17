import type { PipelinesSnapshot } from "../types";

export const pipelinesSnapshotQueryKey = ["pipelines-snapshot"] as const;

const pipelinesSnapshot: PipelinesSnapshot = {
  pipelines: [
    {
      description: "执行模块构建、产物上传和构建通知，不绑定具体模块",
      id: "PIPE-BUILD-RN-BUNDLE",
      lastRunAt: "14:32:18",
      name: "RN Bundle 构建流水线",
      owner: "platform.bot",
      status: "enabled",
      stepCount: 4,
      steps: ["test", "build", "upload_artifact", "notify"],
      triggerMode: "手动 / 开发任务 / Webhook",
      updatedAt: "2026-06-16 14:22",
    },
    {
      description: "把已生成的 Bundle 或组合部署到指定环境",
      id: "PIPE-DEPLOY-BUNDLE",
      lastRunAt: "15:02:11",
      name: "Bundle 部署流水线",
      owner: "release.bot",
      status: "enabled",
      stepCount: 3,
      steps: ["deploy", "notify"],
      triggerMode: "手动 / 发布任务",
      updatedAt: "2026-06-16 13:48",
    },
    {
      description: "发布前对组合产物执行校验、构建和预发部署",
      id: "PIPE-RELEASE-CHECK",
      lastRunAt: "13:40:06",
      name: "发布前置校验流水线",
      owner: "qa.zhao",
      status: "enabled",
      stepCount: 5,
      steps: ["test", "build", "upload_artifact", "deploy", "notify"],
      triggerMode: "发布任务",
      updatedAt: "2026-06-15 18:12",
    },
    {
      description: "用于历史项目的旧版构建链路，等待迁移",
      id: "PIPE-LEGACY-BUILD",
      lastRunAt: "2026-06-10 11:25",
      name: "旧版构建流水线",
      owner: "platform.bot",
      status: "disabled",
      stepCount: 2,
      steps: ["build", "upload_artifact"],
      triggerMode: "手动",
      updatedAt: "2026-06-10 11:30",
    },
  ],
  summary: {
    buildEnabled: 2,
    deployEnabled: 2,
    enabled: 3,
    total: 4,
  },
};

export async function fetchPipelinesSnapshot(): Promise<PipelinesSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return pipelinesSnapshot;
}
