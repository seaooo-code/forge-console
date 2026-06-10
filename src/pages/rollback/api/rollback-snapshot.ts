import type { RollbackSnapshot } from "../types";

export const rollbackSnapshotQueryKey = ["rollback-snapshot"] as const;

const rollbackSnapshot: RollbackSnapshot = {
  environments: [
    {
      currentCombination: "product-combo-20260609.0",
      environment: "product",
      id: "env-product",
      onlineUsers: "2.4M",
      since: "06-09 09:00",
    },
    {
      currentCombination: "preproduct-combo-20260610.1",
      environment: "preProduct",
      id: "env-preproduct",
      onlineUsers: "10K",
      since: "06-10 09:00",
    },
    {
      currentCombination: "preview-combo-20260609.1",
      environment: "preview",
      id: "env-preview",
      onlineUsers: "体验账号",
      since: "06-09 08:12",
    },
    {
      currentCombination: "staging-combo-20260608.5",
      environment: "staging",
      id: "env-staging",
      onlineUsers: "—",
      since: "06-08 18:24",
    },
    {
      currentCombination: "dev-rolling-20260609.2",
      environment: "dev",
      id: "env-dev",
      onlineUsers: "—",
      since: "06-09 14:32",
    },
  ],
  histories: [
    {
      createdAt: "2026-06-09 09:00",
      description: "12 bundles updated",
      id: "combo-product-20260609-0",
      isCurrent: true,
      isSelected: false,
      name: "product-combo-20260609.0",
      risk: "low",
      status: "运行中",
    },
    {
      createdAt: "2026-06-08 09:00",
      description: "8 bundles updated",
      id: "combo-product-20260608-1",
      isCurrent: false,
      isSelected: true,
      name: "product-combo-20260608.1",
      risk: "low",
      status: "可回滚",
    },
    {
      createdAt: "2026-06-07 09:00",
      description: "5 bundles updated",
      id: "combo-product-20260607-0",
      isCurrent: false,
      isSelected: false,
      name: "product-combo-20260607.0",
      risk: "low",
      status: "可回滚",
    },
    {
      createdAt: "2026-06-06 23:18",
      description: "vehicle fix",
      id: "combo-hotfix-20260606-3",
      isCurrent: false,
      isSelected: false,
      name: "hotfix-combo-20260606.3",
      risk: "med",
      status: "已回滚",
    },
    {
      createdAt: "2026-06-06 09:00",
      description: "10 bundles updated",
      id: "combo-product-20260606-0",
      isCurrent: false,
      isSelected: false,
      name: "product-combo-20260606.0",
      risk: "low",
      status: "可回滚",
    },
    {
      createdAt: "2026-06-05 09:00",
      description: "6 bundles updated",
      id: "combo-product-20260605-0",
      isCurrent: false,
      isSelected: false,
      name: "product-combo-20260605.0",
      risk: "low",
      status: "可回滚",
    },
  ],
  impact: {
    affectedUsers: "~2.4M",
    cdnTraffic: "~2.88 TB",
    changes: [
      {
        currentVersion: "2.5.1",
        module: "home",
        targetVersion: "2.5.0",
      },
      {
        currentVersion: "1.9.0",
        module: "ai-assistant",
        targetVersion: "1.8.8",
      },
      {
        currentVersion: "3.2.4",
        module: "message",
        targetVersion: "3.2.3",
      },
    ],
    downloadSize: "~1.2 MB / 用户",
    selectedCombination: "product-combo-20260608.1",
  },
  records: [
    {
      affected: "5% 用户 · 120K",
      environment: "product",
      fromCombination: "hotfix-combo-20260608.1",
      operator: "wang.fang",
      reason: "车控异常 crash 率飙升",
      targetCombination: "product-combo-20260608.0",
      time: "2026-06-08 23:18",
    },
    {
      affected: "10% 用户 · 240K",
      environment: "product",
      fromCombination: "product-combo-20260522.1",
      operator: "huang.tao",
      reason: "支付链路异常",
      targetCombination: "product-combo-20260521.0",
      time: "2026-05-22 16:45",
    },
    {
      affected: "10K 内测",
      environment: "preProduct",
      fromCombination: "preproduct-combo-20260418.2",
      operator: "qa.zhao",
      reason: "预发联调阻塞",
      targetCombination: "preproduct-combo-20260418.0",
      time: "2026-04-18 22:30",
    },
  ],
};

export async function fetchRollbackSnapshot(): Promise<RollbackSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return rollbackSnapshot;
}
