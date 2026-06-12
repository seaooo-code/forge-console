import type { MiCarEnvironmentCode } from "@/types/environments";

export type EnvironmentCode = MiCarEnvironmentCode;

export type EnvironmentStatus = "健康" | "灰度中";

export type EnvironmentCardTone = "amber" | "blue" | "emerald" | "rose" | "sky";

export type RuntimeEnvironment = {
  id: EnvironmentCode;
  code: string;
  name: string;
  status: EnvironmentStatus;
  tone: EnvironmentCardTone;
  description: string;
  traffic: string;
  updatedAt: string;
};

export type EnvironmentDetail = RuntimeEnvironment;

export type EnvironmentsSnapshot = {
  environments: RuntimeEnvironment[];
  details: Record<EnvironmentCode, EnvironmentDetail>;
};
