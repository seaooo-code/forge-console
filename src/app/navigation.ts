import type { NavGroup } from "./layouts/types";

export const navGroups: NavGroup[] = [
  {
    items: [
      { id: "overview", label: "线上现状", href: "/", icon: "overview" },
      { id: "builds", label: "构建", href: "/builds", icon: "build" },
      { id: "release-records", label: "发布记录", href: "/release-records", icon: "releaseRecord" },
      { id: "test-plans", label: "提测单", href: "/test-plans", icon: "testPlan" },
      { id: "modules", label: "模块", href: "/modules", icon: "module" },
      { id: "apps", label: "应用", href: "/apps", icon: "app" },
    ],
  },
  {
    label: "平台",
    items: [
      { id: "code-sources", label: "代码源", href: "/code-sources", icon: "codeSource" },
      { id: "build-adapters", label: "构建适配器", href: "/build-adapters", icon: "buildAdapter" },
      { id: "storage", label: "存储", href: "/storage", icon: "storage" },
      { id: "environments", label: "环境", href: "/environments", icon: "environment" },
      { id: "access-tokens", label: "访问令牌", href: "/access-tokens", icon: "accessToken" },
      {
        id: "tenants",
        label: "租户",
        href: "/tenants",
        icon: "feishuTenant",
        capability: "canManageTenants",
      },
    ],
  },
];
