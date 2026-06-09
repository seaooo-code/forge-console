import type { NavGroup } from "./layouts/types";

export const navGroups: NavGroup[] = [
  {
    label: "概览",
    items: [{ id: "dashboard", label: "仪表盘", href: "/", icon: "dashboard" }],
  },
  {
    label: "资源管理",
    items: [
      { id: "apps", label: "应用管理", href: "/apps", icon: "app" },
      { id: "environments", label: "环境管理", href: "/environments", icon: "environment" },
      { id: "modules", label: "模块管理", href: "/modules", icon: "module" },
    ],
  },
  {
    label: "研发协作",
    items: [
      { id: "dev-tasks", label: "开发任务", href: "/dev-tasks", icon: "task" },
      { id: "pipelines", label: "流水线执行", href: "/pipelines", icon: "pipeline" },
    ],
  },
  {
    label: "BUNDLE 产物",
    items: [
      { id: "bundles", label: "Bundle 版本", href: "/bundles", icon: "bundle" },
      { id: "combinations", label: "Bundle 组合", href: "/combinations", icon: "dashboard" },
    ],
  },
  {
    label: "发布运维",
    items: [
      { id: "releases", label: "发布任务", href: "/releases", icon: "release" },
      { id: "gray", label: "灰度管理", href: "/gray", icon: "pipeline" },
      { id: "rollback", label: "回滚中心", href: "/rollback", icon: "rollback" },
    ],
  },
  {
    label: "平台",
    items: [{ id: "settings", label: "系统设置", href: "/settings", icon: "settings" }],
  },
];
