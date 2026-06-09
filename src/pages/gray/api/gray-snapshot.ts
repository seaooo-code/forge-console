import type { GraySnapshot } from "../types";

export const graySnapshotQueryKey = ["gray-snapshot"] as const;

const graySnapshot: GraySnapshot = {
  histories: [
    {
      action: "推进",
      after: "20%",
      before: "10%",
      id: "history-104230",
      note: "健康度正常，按计划推进",
      operator: "li.ming",
      releaseId: "RT-20260611",
      time: "10:42:30",
    },
    {
      action: "推进",
      after: "10%",
      before: "5%",
      id: "history-101842",
      note: "无异常",
      operator: "li.ming",
      releaseId: "RT-20260611",
      time: "10:18:42",
    },
    {
      action: "推进",
      after: "5%",
      before: "1%",
      id: "history-100508",
      note: "自动推进",
      operator: "system",
      releaseId: "RT-20260611",
      time: "10:05:08",
    },
    {
      action: "回滚",
      after: "0%",
      before: "5%",
      id: "history-0608-2314",
      note: "车控异常，紧急回滚",
      operator: "wang.fang",
      releaseId: "RT-20260608",
      time: "06-08 23:14",
    },
    {
      action: "全量",
      after: "100%",
      before: "50%",
      id: "history-0609-1030",
      note: "全量完成",
      operator: "release.bot",
      releaseId: "RT-20260609",
      time: "06-09 10:30",
    },
  ],
  rollouts: [
    {
      audience: "480K 用户",
      errorTrend: [
        0.18, 0.31, 0.24, 0.2, 0.16, 0.28, 0.26, 0.11, 0.12, 0.14, 0.21, 0.19, 0.13, 0.27, 0.16,
        0.1, 0.2, 0.29, 0.34, 0.23, 0.38, 0.28, 0.19, 0.16, 0.25, 0.32, 0.27,
      ],
      health: "99.8%",
      id: "gray-rt-20260611",
      jsErrorRate: "0.02%",
      metrics: [
        { label: "Crash Free", value: "99.98%" },
        { label: "ANR Free", value: "99.92%" },
        { label: "白屏率", value: "0.03%" },
      ],
      p99: "482ms",
      percent: 20,
      releaseId: "RT-20260611",
      startAt: "10:00",
      status: "推进中",
      title: "AI助手 + 首页发布",
    },
    {
      audience: "2.4M 用户",
      errorTrend: [
        0.12, 0.16, 0.18, 0.22, 0.3, 0.28, 0.25, 0.23, 0.2, 0.14, 0.12, 0.18, 0.3, 0.2, 0.13, 0.15,
        0.19, 0.27, 0.32, 0.35, 0.28, 0.33, 0.24, 0.18, 0.22, 0.26, 0.34,
      ],
      health: "99.95%",
      id: "gray-rt-20260609",
      jsErrorRate: "0.01%",
      metrics: [
        { label: "Crash Free", value: "99.98%" },
        { label: "ANR Free", value: "99.92%" },
        { label: "白屏率", value: "0.03%" },
      ],
      p99: "482ms",
      percent: 100,
      releaseId: "RT-20260609",
      startAt: "06-09 09:00",
      status: "已全量",
      title: "周二常规发布",
    },
    {
      audience: "10K 用户",
      errorTrend: [
        0.02, 0.04, 0.03, 0.01, 0.05, 0.04, 0.03, 0.02, 0.06, 0.05, 0.03, 0.01, 0.02, 0.04, 0.05,
        0.03, 0.02, 0.04, 0.06, 0.04, 0.03, 0.02, 0.01, 0.03, 0.04, 0.05, 0.03,
      ],
      health: "100%",
      id: "gray-rt-20260610",
      jsErrorRate: "0%",
      metrics: [
        { label: "Crash Free", value: "99.98%" },
        { label: "ANR Free", value: "99.92%" },
        { label: "白屏率", value: "0.03%" },
      ],
      p99: "482ms",
      percent: 100,
      releaseId: "RT-20260610",
      startAt: "06-10 09:00",
      status: "已全量",
      title: "消息中心预发",
    },
  ],
  summary: [
    {
      detail: "1 个待审批",
      id: "active",
      label: "进行中灰度",
      value: "3",
    },
    {
      detail: "占比 96.3%",
      id: "users",
      label: "覆盖用户",
      value: "2.89M",
    },
    {
      detail: "近 24h 平均",
      id: "health",
      label: "整体健康度",
      value: "99.7%",
    },
    {
      detail: "需立即关注",
      id: "alerts",
      label: "异常告警",
      value: "1",
    },
  ],
};

export async function fetchGraySnapshot(): Promise<GraySnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return graySnapshot;
}
