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
      { id: "modules", label: "模块管理", href: "/modules", icon: "module" },
    ],
  },
  {
    label: "研发交付",
    items: [{ id: "builds", label: "构建管理", href: "/builds", icon: "build" }],
  },
  {
    label: "发布运维",
    items: [
      { id: "release-records", label: "发布记录", href: "/release-records", icon: "releaseRecord" },
    ],
  },
  {
    label: "平台",
    items: [
      { id: "code-sources", label: "代码源管理", href: "/code-sources", icon: "codeSource" },
      { id: "storage", label: "存储管理", href: "/storage", icon: "storage" },
      { id: "environments", label: "环境管理", href: "/environments", icon: "environment" },
      { id: "access-tokens", label: "访问令牌", href: "/access-tokens", icon: "accessToken" },
      { id: "settings", isMock: true, label: "系统设置", href: "/settings", icon: "settings" },
    ],
  },
];
