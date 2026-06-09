import type { ApplicationsSnapshot } from "../types";

export const applicationsSnapshotQueryKey = ["applications-snapshot"] as const;

const applicationsSnapshot: ApplicationsSnapshot = {
  summary: {
    maintenance: 2,
    offline: 1,
    running: 6,
    total: 8,
  },
  applications: [
    {
      id: "app-mi-car",
      name: "小米汽车",
      slug: "mi-car",
      platform: "iOS / Android",
      owner: "li.ming",
      moduleCount: 12,
      environmentCount: 4,
      createdAt: "2024-03-12",
      status: "运行中",
    },
    {
      id: "app-mijia",
      name: "米家",
      slug: "mijia",
      platform: "iOS / Android",
      owner: "wang.fang",
      moduleCount: 18,
      environmentCount: 4,
      createdAt: "2022-01-08",
      status: "运行中",
    },
    {
      id: "app-xiaoai",
      name: "小爱同学",
      slug: "xiaoai",
      platform: "iOS / Android / HarmonyOS",
      owner: "zhao.lei",
      moduleCount: 9,
      environmentCount: 4,
      createdAt: "2023-06-22",
      status: "运行中",
    },
    {
      id: "app-miui-browser",
      name: "MIUI 浏览器",
      slug: "miui-browser",
      platform: "Android",
      owner: "chen.hao",
      moduleCount: 6,
      environmentCount: 3,
      createdAt: "2021-11-04",
      status: "维护中",
    },
    {
      id: "app-mi-fit",
      name: "小米运动健康",
      slug: "mi-fit",
      platform: "iOS / Android",
      owner: "sun.yu",
      moduleCount: 11,
      environmentCount: 4,
      createdAt: "2022-09-30",
      status: "运行中",
    },
    {
      id: "app-mi-shop",
      name: "小米商城",
      slug: "mi-shop",
      platform: "iOS / Android",
      owner: "liu.qi",
      moduleCount: 14,
      environmentCount: 4,
      createdAt: "2020-05-19",
      status: "运行中",
    },
    {
      id: "app-mi-pay",
      name: "小米钱包",
      slug: "mi-pay",
      platform: "Android",
      owner: "zhou.xin",
      moduleCount: 7,
      environmentCount: 4,
      createdAt: "2023-02-14",
      status: "维护中",
    },
    {
      id: "app-mi-tv",
      name: "小米电视助手",
      slug: "mi-tv",
      platform: "Android TV",
      owner: "huang.tao",
      moduleCount: 4,
      environmentCount: 2,
      createdAt: "2019-08-01",
      status: "已下线",
    },
  ],
};

export async function fetchApplicationsSnapshot(): Promise<ApplicationsSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return applicationsSnapshot;
}
