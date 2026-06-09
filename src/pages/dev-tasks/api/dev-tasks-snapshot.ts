import type { DevTasksSnapshot } from "../types";

export const devTasksSnapshotQueryKey = ["dev-tasks-snapshot"] as const;

const devTasksSnapshot: DevTasksSnapshot = {
  featuredTask: {
    id: "MCAR-1234",
    members: [
      { label: "开发负责人", value: "li.ming" },
      { label: "协作开发", value: "wang.fang, zhou.xin" },
      { label: "测试", value: "qa.zhao" },
      { label: "产品", value: "pm.gao" },
    ],
    pipelineRuns: [
      { duration: "1m 24s", id: "#48291", module: "home", status: "running" },
      { duration: "3m 12s", id: "#48289", module: "ai-assistant", status: "success" },
      { duration: "0m 48s", id: "#48285", module: "message", status: "failed" },
      { duration: "2m 56s", id: "#48280", module: "home", status: "success" },
    ],
    relatedModules: [
      {
        branch: "feature/MCAR-1234-ai-entry",
        module: "home",
        status: "构建中",
      },
      {
        branch: "feature/MCAR-1234-redesign",
        module: "ai-assistant",
        status: "成功",
      },
      {
        branch: "feature/MCAR-1234-banner",
        module: "message",
        status: "失败",
      },
    ],
    title: "AI助手入口改版",
  },
  tasks: [
    {
      createdAt: "2026-06-02",
      developer: "li.ming",
      id: "MCAR-1234",
      moduleBadges: ["M1", "M2", "M3"],
      moduleCount: 3,
      progress: 65,
      requirement: "PRD-2026-0421",
      status: "开发中",
      tester: "qa.zhao",
      title: "AI助手入口改版",
    },
    {
      createdAt: "2026-05-30",
      developer: "wang.fang",
      id: "MCAR-1228",
      moduleBadges: ["M1", "M2"],
      moduleCount: 2,
      progress: 80,
      requirement: "PRD-2026-0418",
      status: "联调中",
      tester: "qa.li",
      title: "车控卡片瀑布流",
    },
    {
      createdAt: "2026-05-28",
      developer: "zhao.lei",
      id: "MCAR-1219",
      moduleBadges: ["M1", "M2", "M3"],
      moduleCount: 3,
      progress: 90,
      requirement: "PRD-2026-0410",
      status: "测试中",
      tester: "qa.sun",
      title: "消息中心 IM 升级",
    },
    {
      createdAt: "2026-05-22",
      developer: "chen.hao",
      id: "MCAR-1208",
      moduleBadges: ["M1"],
      moduleCount: 1,
      progress: 100,
      requirement: "TECH-2026-0044",
      status: "待发布",
      tester: "qa.zhao",
      title: "首页性能优化",
    },
    {
      createdAt: "2026-05-15",
      developer: "sun.yu",
      id: "MCAR-1196",
      moduleBadges: ["M1", "M2"],
      moduleCount: 2,
      progress: 100,
      requirement: "PRD-2026-0399",
      status: "已发布",
      tester: "qa.li",
      title: "OTA 升级提醒",
    },
    {
      createdAt: "2026-05-10",
      developer: "liu.qi",
      id: "MCAR-1187",
      moduleBadges: ["M1", "M2"],
      moduleCount: 2,
      progress: 45,
      requirement: "PRD-2026-0388",
      status: "开发中",
      tester: "qa.sun",
      title: "语音指令优化",
    },
    {
      createdAt: "2026-05-02",
      developer: "zhou.xin",
      id: "MCAR-1172",
      moduleBadges: ["M1", "M2", "M3"],
      moduleCount: 3,
      progress: 30,
      requirement: "PRD-2026-0370",
      status: "已挂起",
      tester: "qa.zhao",
      title: "导航地图重构",
    },
    {
      createdAt: "2026-04-26",
      developer: "huang.tao",
      id: "MCAR-1158",
      moduleBadges: ["M1"],
      moduleCount: 1,
      progress: 100,
      requirement: "PRD-2026-0355",
      status: "已发布",
      tester: "qa.li",
      title: "支付流程升级",
    },
  ],
};

export async function fetchDevTasksSnapshot(): Promise<DevTasksSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return devTasksSnapshot;
}
