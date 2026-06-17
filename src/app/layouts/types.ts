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
  | "build"
  | "bundle"
  | "codeSource"
  | "dashboard"
  | "environment"
  | "module"
  | "pipeline"
  | "release"
  | "releaseRecord"
  | "rollback"
  | "settings"
  | "storage"
  | "task";
