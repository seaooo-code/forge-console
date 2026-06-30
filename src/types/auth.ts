export type AuthUser = {
  id: string;
  unionId: string;
  openId: string;
  userId: string;
  name: string;
  enName: string;
  avatarUrl: string;
  avatarThumb: string;
  avatarMiddle: string;
  avatarBig: string;
  email: string;
  enterpriseEmail: string;
  mobile: string;
  tenantKey: string;
  employeeNo: string;
};

export type AuthTokenMeta = {
  expiresIn: number;
  refreshTokenExpiresIn?: number;
  tokenType: string;
  scope: string;
  hasRefreshToken: boolean;
};

export type GlobalRole = "SuperAdmin" | "PlatformAdmin" | "ReleaseAdmin" | "Auditor";

export type GlobalCapabilities = {
  canCreateApplication: boolean;
  canManageApplications: boolean;
  canManageModules: boolean;
  canCreateBuild: boolean;
  canCreateRelease: boolean;
  canManageCodeSources: boolean;
  canManageStorage: boolean;
  canManageEnvironments: boolean;
  canManageAccessTokens: boolean;
};

export type AuthSession = {
  authorizedAt: string;
  capabilities: GlobalCapabilities;
  roles: GlobalRole[];
  token: AuthTokenMeta;
  user: AuthUser;
};

export type FeishuAuthResponse = {
  capabilities?: Partial<GlobalCapabilities>;
  roles?: GlobalRole[];
  token: AuthTokenMeta;
  user: AuthUser;
};
