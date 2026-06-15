export type AuthUser = {
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

export type AuthSession = {
  authorizedAt: string;
  token: AuthTokenMeta;
  user: AuthUser;
};

export type FeishuAuthResponse = {
  token: AuthTokenMeta;
  user: AuthUser;
};
