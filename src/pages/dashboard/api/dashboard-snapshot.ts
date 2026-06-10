import type { DashboardSnapshot } from "../types";

export const dashboardSnapshotQueryKey = ["dashboard-snapshot"] as const;

const dashboardSnapshot: DashboardSnapshot = {
  metrics: [
    {
      id: "apps",
      label: "应用数量",
      value: "8",
      trend: "+1",
      trendTone: "positive",
      icon: "app",
      iconTone: "blue",
      sparkline: [8, 12, 10, 15, 13, 17, 21, 19, 23],
    },
    {
      id: "modules",
      label: "模块数量",
      value: "42",
      trend: "+3",
      trendTone: "positive",
      icon: "module",
      iconTone: "cyan",
      sparkline: [14, 19, 17, 23, 21, 26, 31, 29, 34],
    },
    {
      id: "tasks",
      label: "开发任务",
      value: "126",
      trend: "+18",
      trendTone: "positive",
      icon: "task",
      iconTone: "amber",
      sparkline: [31, 38, 35, 44, 40, 48, 56, 53, 61],
    },
    {
      id: "pipelines",
      label: "运行中流水线",
      value: "9",
      trend: "-2",
      trendTone: "negative",
      icon: "pipeline",
      iconTone: "green",
      sparkline: [5, 9, 7, 12, 10, 14, 18, 16, 20],
    },
    {
      id: "bundles",
      label: "Bundle 版本",
      value: "3,284",
      trend: "+126",
      trendTone: "positive",
      icon: "bundle",
      iconTone: "sky",
      sparkline: [44, 52, 49, 58, 61, 69, 77, 73, 82],
    },
    {
      id: "releases",
      label: "进行中发布",
      value: "4",
      trend: "+1",
      trendTone: "positive",
      icon: "release",
      iconTone: "red",
      sparkline: [2, 4, 3, 5, 4, 6, 8, 7, 9],
    },
  ],
  buildTrend: [
    { date: "6/3", buildCount: 64, successCount: 57 },
    { date: "6/4", buildCount: 86, successCount: 77 },
    { date: "6/5", buildCount: 74, successCount: 68 },
    { date: "6/6", buildCount: 108, successCount: 95 },
    { date: "6/7", buildCount: 94, successCount: 88 },
    { date: "6/8", buildCount: 132, successCount: 121 },
    { date: "6/9", buildCount: 144, successCount: 138 },
  ],
  pipelineRates: [
    { name: "RN Standard Pipeline", rate: 96 },
    { name: "Vehicle Pipeline", rate: 92 },
    { name: "AI Pipeline", rate: 88 },
  ],
  tasks: [
    {
      id: "MCAR-1234",
      title: "AI助手入口改版",
      developer: "li.ming",
      moduleCount: 3,
      status: "dev",
    },
    {
      id: "MCAR-1208",
      title: "首页车控卡片重构",
      developer: "wang.fang",
      moduleCount: 2,
      status: "test",
    },
    {
      id: "MCAR-1196",
      title: "消息中心 IM 升级",
      developer: "zhao.lei",
      moduleCount: 4,
      status: "review",
    },
    {
      id: "MCAR-1187",
      title: "OTA 升级提醒",
      developer: "chen.hao",
      moduleCount: 1,
      status: "done",
    },
    {
      id: "MCAR-1172",
      title: "语音指令优化",
      developer: "sun.yu",
      moduleCount: 2,
      status: "dev",
    },
  ],
  releases: [
    { id: "RT-20260611", environment: "product", gray: "20%", status: "灰度中" },
    { id: "RT-20260610", environment: "preProduct", gray: "100%", status: "已完成" },
    { id: "RT-20260609", environment: "product", gray: "100%", status: "已完成" },
    { id: "RT-20260608", environment: "product", gray: "5%", status: "已回滚" },
    { id: "RT-20260607", environment: "staging", gray: "—", status: "已完成" },
  ],
  updatedAt: new Date().toISOString(),
};

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return {
    ...dashboardSnapshot,
    updatedAt: new Date().toISOString(),
  };
}
