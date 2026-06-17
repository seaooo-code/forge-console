import type { ReleaseRecordsSnapshot } from "../types";

export const releaseRecordsSnapshotQueryKey = ["release-records-snapshot"] as const;

const releaseRecordsSnapshot: ReleaseRecordsSnapshot = {
  records: [
    {
      artifact: "combo-20260609-018",
      application: "小米汽车",
      effectiveAt: "15:04:29",
      environment: "staging",
      id: "PUB-29018",
      moduleCount: 12,
      operator: "release.bot",
      startedAt: "15:02:11",
      status: "running",
      strategy: "灰度 20%",
      triggerId: "REL-20260609-018",
      triggerType: "release_task",
    },
    {
      artifact: "home@2.6.0-rc.1",
      application: "小米汽车",
      effectiveAt: "14:45:28",
      environment: "staging",
      id: "PUB-29017",
      moduleCount: 1,
      operator: "li.ming",
      startedAt: "14:44:22",
      status: "success",
      strategy: "直接指向",
      triggerId: "manual",
      triggerType: "manual",
    },
    {
      artifact: "combo-20260609-014",
      application: "小米汽车",
      effectiveAt: "14:23:50",
      environment: "preview",
      id: "PUB-29016",
      moduleCount: 10,
      operator: "pipeline.bot",
      startedAt: "14:20:08",
      status: "success",
      strategy: "全量指向",
      triggerId: "PIPE-1814",
      triggerType: "pipeline",
    },
    {
      artifact: "message@3.3.0-rc.1",
      application: "小米汽车",
      effectiveAt: "-",
      environment: "preview",
      id: "PUB-29015",
      moduleCount: 1,
      operator: "wang.fang",
      startedAt: "14:12:03",
      status: "failed",
      strategy: "直接指向",
      triggerId: "manual",
      triggerType: "manual",
    },
    {
      artifact: "combo-20260609-011",
      application: "小米汽车",
      effectiveAt: "-",
      environment: "preProduct",
      id: "PUB-29014",
      moduleCount: 12,
      operator: "release.bot",
      startedAt: "14:04:18",
      status: "queued",
      strategy: "审批后指向",
      triggerId: "REL-20260609-011",
      triggerType: "release_task",
    },
  ],
  summary: {
    failed: 1,
    queued: 1,
    running: 1,
    success: 2,
    total: 5,
  },
};

export async function fetchReleaseRecordsSnapshot(): Promise<ReleaseRecordsSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return releaseRecordsSnapshot;
}
