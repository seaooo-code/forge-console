import type { GlobalCapabilities } from "@/types/auth";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
  /** 只对拥有该全局能力的用户显示。 */
  capability?: keyof GlobalCapabilities;
};

export type NavGroup = {
  /** 分组标题；首组为主菜单，不显示标题。 */
  label?: string;
  items: NavItem[];
};

export type NavIconName =
  | "accessToken"
  | "app"
  | "build"
  | "buildAdapter"
  | "codeSource"
  | "environment"
  | "feishuTenant"
  | "module"
  | "overview"
  | "releaseRecord"
  | "storage";
