import type { MiCarEnvironmentCode } from "@/types/environments";

export type MemberStatus = "停用" | "启用";

export type SettingsNavItem = {
  id: string;
  label: string;
};

export type MemberRecord = {
  avatar: string;
  email: string;
  id: string;
  lastActive: string;
  name: string;
  role: string;
  status: MemberStatus;
  team: string;
};

export type PermissionMatrixRecord = {
  developer: boolean;
  id: string;
  permission: string;
  platformAdmin: boolean;
  readonly: boolean;
  releaseAdmin: boolean;
  superAdmin: boolean;
  tester: boolean;
};

export type CdnConfigRecord = {
  domain: string;
  environment: MiCarEnvironmentCode;
  hitRate: string;
  id: string;
};

export type NotificationChannelRecord = {
  id: string;
  label: string;
  value: string;
};

export type SettingsSnapshot = {
  cdnConfigs: CdnConfigRecord[];
  members: MemberRecord[];
  navItems: SettingsNavItem[];
  notifications: NotificationChannelRecord[];
  permissions: PermissionMatrixRecord[];
};
