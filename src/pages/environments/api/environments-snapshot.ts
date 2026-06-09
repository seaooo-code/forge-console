import type { EnvironmentsSnapshot } from "../types";

export const environmentsSnapshotQueryKey = ["environments-snapshot"] as const;

const environmentsSnapshot: EnvironmentsSnapshot = {
  environments: [
    {
      id: "dev",
      code: "DEV",
      name: "开发环境",
      status: "健康",
      tone: "sky",
      description: "开发分支自动构建滚动部署",
      currentCombination: "dev-rolling-20260609.2",
      traffic: "-",
      updatedAt: "2 分钟前",
    },
    {
      id: "test",
      code: "TEST",
      name: "测试环境",
      status: "健康",
      tone: "blue",
      description: "QA 验收，所有 PR 必须通过",
      currentCombination: "test-combo-20260608.5",
      traffic: "QA 内网",
      updatedAt: "1 小时前",
    },
    {
      id: "pre",
      code: "PRE",
      name: "预发环境",
      status: "健康",
      tone: "amber",
      description: "线上数据，灰度前最后验证",
      currentCombination: "pre-combo-20260609.1",
      traffic: "10K 内测",
      updatedAt: "3 小时前",
    },
    {
      id: "prod",
      code: "PROD",
      name: "生产环境",
      status: "灰度中",
      tone: "rose",
      description: "正式环境，受发布单约束",
      currentCombination: "prod-combo-20260609.0",
      traffic: "2.4M 在线",
      updatedAt: "12 分钟前",
    },
  ],
  matrix: [
    {
      id: "common",
      moduleName: "common",
      moduleType: "Common Bundle",
      dev: "1.4.0-rc.2",
      test: "1.3.5",
      pre: "1.3.5",
      prod: "1.3.0",
    },
    {
      id: "home",
      moduleName: "home",
      moduleType: "Feature Bundle",
      dev: "2.6.0-rc.1",
      test: "2.5.3",
      pre: "2.5.3",
      prod: "2.5.1",
    },
    {
      id: "vehicle",
      moduleName: "vehicle",
      moduleType: "Feature Bundle",
      dev: "4.9.0-beta",
      test: "4.8.5",
      pre: "4.8.5",
      prod: "4.8.2",
    },
    {
      id: "ai-assistant",
      moduleName: "ai-assistant",
      moduleType: "Feature Bundle",
      dev: "2.0.0-rc.3",
      test: "1.9.4",
      pre: "1.9.4",
      prod: "1.9.0",
    },
    {
      id: "message",
      moduleName: "message",
      moduleType: "Feature Bundle",
      dev: "3.3.0-rc.1",
      test: "3.2.6",
      pre: "3.2.6",
      prod: "3.2.4",
    },
  ],
};

export async function fetchEnvironmentsSnapshot(): Promise<EnvironmentsSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return environmentsSnapshot;
}
