export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: NavIconName;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type NavIconName =
  | "app"
  | "bundle"
  | "dashboard"
  | "environment"
  | "module"
  | "pipeline"
  | "release"
  | "rollback"
  | "settings"
  | "task";
