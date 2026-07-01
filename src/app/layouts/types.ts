export type NavItem = {
  id: string;
  isMock?: boolean;
  label: string;
  href: string;
  icon: NavIconName;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type NavIconName =
  | "accessToken"
  | "app"
  | "build"
  | "codeSource"
  | "dashboard"
  | "environment"
  | "module"
  | "releaseRecord"
  | "settings"
  | "storage";
