import type {
  ApplicationDetail,
  ApplicationEnvironmentRecord,
  ApplicationMemberRecord,
  ApplicationModuleRecord,
  ApplicationPipelineRecord,
  ApplicationsSnapshot,
  HostApplication,
} from "../types";

export const applicationsSnapshotQueryKey = ["applications-snapshot"] as const;

const applications: HostApplication[] = [
  {
    id: "app-mi-car",
    name: "小米汽车",
    slug: "mi-car",
    platform: "iOS / Android",
    owner: "li.ming",
    moduleCount: 12,
    environmentCount: 5,
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
];

const applicationsSnapshot: ApplicationsSnapshot = {
  summary: {
    maintenance: 2,
    offline: 1,
    running: 6,
    total: 8,
  },
  applications,
  details: Object.fromEntries(
    applications.map((application) => [application.slug, createDetail(application)]),
  ),
};

export async function fetchApplicationsSnapshot(): Promise<ApplicationsSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return applicationsSnapshot;
}

function createDetail(application: HostApplication): ApplicationDetail {
  return {
    id: application.id,
    appKey: `rn.${application.slug}`,
    bundleNamespace: `com.xiaomi.${application.slug.replaceAll("-", ".")}.rn`,
    description: `${application.name} 宿主应用的 RN Bundle 接入配置、环境绑定和模块运行概览。`,
    environments: createEnvironments(application),
    members: createMembers(application),
    metrics: [
      {
        detail: application.platform,
        id: "platform",
        label: "支持平台",
        tone: "blue",
        value: String(application.platform.split("/").length),
      },
      {
        detail: "已接入模块",
        id: "modules",
        label: "模块数量",
        tone: "emerald",
        value: String(application.moduleCount),
      },
      {
        detail: "已启用环境",
        id: "environments",
        label: "环境数量",
        tone: "amber",
        value: String(application.environmentCount),
      },
      {
        detail: "最近 24 小时",
        id: "success",
        label: "构建成功率",
        tone: application.status === "维护中" ? "amber" : "emerald",
        value: application.status === "维护中" ? "91.4%" : "96.8%",
      },
    ],
    modules: createModules(application),
    name: application.name,
    ownerTeam: getOwnerTeam(application),
    packageName: getPackageName(application),
    pipelines: createPipelines(application),
    releasePolicy:
      application.status === "已下线" ? "禁止发布，仅保留历史 Bundle 查询" : "发布单审批后进入灰度",
    repositoryGroup: `git@git.mi.com:${application.slug}-rn`,
    slug: application.slug,
  };
}

function createEnvironments(application: HostApplication): ApplicationEnvironmentRecord[] {
  const allEnvironments: ApplicationEnvironmentRecord[] = [
    {
      bundleCount: application.moduleCount,
      combination: `${application.slug}-dev-rolling-20260609.2`,
      environment: "dev",
      id: "dev",
      status: application.status === "维护中" ? "维护中" : "健康",
      traffic: "-",
      updatedAt: "2 分钟前",
    },
    {
      bundleCount: application.moduleCount,
      combination: `${application.slug}-staging-combo-20260608.5`,
      environment: "staging",
      id: "staging",
      status: "健康",
      traffic: "研发内网",
      updatedAt: "1 小时前",
    },
    {
      bundleCount: application.moduleCount,
      combination: `${application.slug}-preview-combo-20260609.1`,
      environment: "preview",
      id: "preview",
      status: "健康",
      traffic: "体验账号",
      updatedAt: "3 小时前",
    },
    {
      bundleCount: application.moduleCount,
      combination: `${application.slug}-preproduct-combo-20260609.1`,
      environment: "preProduct",
      id: "preProduct",
      status: "健康",
      traffic: "10K 内测",
      updatedAt: "28 分钟前",
    },
    {
      bundleCount: application.moduleCount,
      combination: `${application.slug}-product-combo-20260609.0`,
      environment: "product",
      id: "product",
      status: application.status === "运行中" ? "灰度中" : "维护中",
      traffic: application.slug === "mi-car" ? "2.4M 在线" : "680K 在线",
      updatedAt: "12 分钟前",
    },
  ];

  return allEnvironments.slice(0, application.environmentCount);
}

function createModules(application: HostApplication): ApplicationModuleRecord[] {
  return [
    {
      id: "common",
      kind: "Common",
      latestVersion: "1.3.0",
      name: "common",
      owner: application.owner,
      pipeline: "RN Standard Pipeline",
      repository: `${application.slug}-rn/common.git`,
      status: "活跃",
    },
    {
      id: "home",
      kind: "Feature",
      latestVersion: "2.5.1",
      name: "home",
      owner: "wang.fang",
      pipeline: "RN Standard Pipeline",
      repository: `${application.slug}-rn/home.git`,
      status: "活跃",
    },
    {
      id: "vehicle",
      kind: "Feature",
      latestVersion: "4.8.2",
      name: application.slug === "mi-car" ? "vehicle" : "main-flow",
      owner: "zhao.lei",
      pipeline: application.slug === "mi-car" ? "Vehicle Pipeline" : "RN Standard Pipeline",
      repository: `${application.slug}-rn/vehicle.git`,
      status: application.status === "维护中" ? "冻结" : "活跃",
    },
    {
      id: "message",
      kind: "Feature",
      latestVersion: "3.2.4",
      name: "message",
      owner: "sun.yu",
      pipeline: "RN Standard Pipeline",
      repository: `${application.slug}-rn/message.git`,
      status: "活跃",
    },
  ];
}

function createMembers(application: HostApplication): ApplicationMemberRecord[] {
  return [
    { id: "owner", name: application.owner, role: "Owner", team: getOwnerTeam(application) },
    { id: "dev", name: "wang.fang", role: "Developer", team: "RN 业务组" },
    { id: "qa", name: "qa.zhao", role: "QA", team: "小米汽车 - QA 组" },
    { id: "release", name: "release.bot", role: "Release", team: "发布平台" },
  ];
}

function createPipelines(application: HostApplication): ApplicationPipelineRecord[] {
  return [
    {
      branch: "feature/MCAR-1234-ai-entry",
      duration: "1m 24s",
      id: "48291",
      moduleName: "home",
      operator: application.owner,
      runId: "#48291",
      startedAt: "14:32:18",
      status: application.status === "维护中" ? "queued" : "running",
    },
    {
      branch: "release/2.5.3",
      duration: "3m 02s",
      id: "48290",
      moduleName: "vehicle",
      operator: "wang.fang",
      runId: "#48290",
      startedAt: "14:28:01",
      status: "success",
    },
    {
      branch: "feature/MCAR-1234-banner",
      duration: "0m 48s",
      id: "48285",
      moduleName: "message",
      operator: "sun.yu",
      runId: "#48285",
      startedAt: "14:11:20",
      status: "failed",
    },
  ];
}

function getOwnerTeam(application: HostApplication) {
  if (application.slug === "mi-car") {
    return "小米汽车 - RN 平台组";
  }

  if (application.status === "已下线") {
    return "归档应用";
  }

  return `${application.name} - 业务研发组`;
}

function getPackageName(application: HostApplication) {
  if (application.platform.includes("iOS")) {
    return `com.xiaomi.${application.slug.replaceAll("-", "")}`;
  }

  return `com.mi.${application.slug.replaceAll("-", "")}`;
}
