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
      id: "staging",
      code: "STAGING",
      name: "联调环境",
      status: "健康",
      tone: "blue",
      description: "多模块联调，接入测试账号与模拟数据",
      currentCombination: "staging-combo-20260608.5",
      traffic: "研发内网",
      updatedAt: "1 小时前",
    },
    {
      id: "preview",
      code: "PREVIEW",
      name: "预览环境",
      status: "健康",
      tone: "amber",
      description: "产品验收与版本预览，灰度前体验验证",
      currentCombination: "preview-combo-20260609.1",
      traffic: "体验账号",
      updatedAt: "3 小时前",
    },
    {
      id: "preProduct",
      code: "PREPRODUCT",
      name: "预生产环境",
      status: "健康",
      tone: "emerald",
      description: "线上配置与真实链路，生产前最后验证",
      currentCombination: "preproduct-combo-20260609.1",
      traffic: "10K 内测",
      updatedAt: "28 分钟前",
    },
    {
      id: "product",
      code: "PRODUCT",
      name: "生产环境",
      status: "灰度中",
      tone: "rose",
      description: "正式环境，受发布单约束",
      currentCombination: "product-combo-20260609.0",
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
      staging: "1.3.5",
      preview: "1.3.5",
      preProduct: "1.3.5",
      product: "1.3.0",
    },
    {
      id: "home",
      moduleName: "home",
      moduleType: "Feature Bundle",
      dev: "2.6.0-rc.1",
      staging: "2.5.3",
      preview: "2.5.3",
      preProduct: "2.5.3",
      product: "2.5.1",
    },
    {
      id: "vehicle",
      moduleName: "vehicle",
      moduleType: "Feature Bundle",
      dev: "4.9.0-beta",
      staging: "4.8.5",
      preview: "4.8.5",
      preProduct: "4.8.5",
      product: "4.8.2",
    },
    {
      id: "ai-assistant",
      moduleName: "ai-assistant",
      moduleType: "Feature Bundle",
      dev: "2.0.0-rc.3",
      staging: "1.9.4",
      preview: "1.9.4",
      preProduct: "1.9.4",
      product: "1.9.0",
    },
    {
      id: "message",
      moduleName: "message",
      moduleType: "Feature Bundle",
      dev: "3.3.0-rc.1",
      staging: "3.2.6",
      preview: "3.2.6",
      preProduct: "3.2.6",
      product: "3.2.4",
    },
  ],
};

export async function fetchEnvironmentsSnapshot(): Promise<EnvironmentsSnapshot> {
  await new Promise((resolve) => window.setTimeout(resolve, 120));

  return environmentsSnapshot;
}
