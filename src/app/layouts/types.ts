export type NavItem = {
  id: string;
  isMock?: boolean;
  label: string;
  href: string;
  icon: NavIconName;
  /** Optional small badge / counter shown on the right of the item. */
  meta?: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type NavIconName =
  | "accessToken"
  | "app"
  | "build"
  | "buildAdapter"
  | "codeSource"
  | "dashboard"
  | "environment"
  | "module"
  | "releaseRecord"
  | "storage";
