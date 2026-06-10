import type { AuthSession, AuthTokenMeta, AuthUser } from "@/types/auth";

export type FeishuAuthResponse = {
  token: AuthTokenMeta;
  user: AuthUser;
};

export type { AuthSession };
