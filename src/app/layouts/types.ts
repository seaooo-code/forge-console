export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
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
  | "module"
  | "overview"
  | "releaseRecord"
  | "storage";
