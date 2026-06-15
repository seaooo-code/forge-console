export type EnvironmentCode = string;

export type EnvironmentStatus = "健康" | "灰度中";

export type EnvironmentStatusCode = "gray" | "healthy";

export type EnvironmentCardTone = "amber" | "blue" | "emerald" | "rose" | "sky";

export type RuntimeEnvironment = {
  id: EnvironmentCode;
  name: string;
  status: EnvironmentStatus;
  tone: EnvironmentCardTone;
  description: string;
  storageConfigurationId: string;
  storageConfigurationName: string;
  updatedAt: string;
};

export type EnvironmentDetail = RuntimeEnvironment;

export type EnvironmentsSnapshot = {
  environments: RuntimeEnvironment[];
  details: Record<EnvironmentCode, EnvironmentDetail>;
};

export type EnvironmentMutationInput = {
  code: string;
  description: string;
  name: string;
  status: EnvironmentStatusCode;
  storageConfigurationId: string;
  tone: EnvironmentCardTone;
};

export type EnvironmentFormState = {
  code: string;
  description: string;
  name: string;
  status: EnvironmentStatusCode;
  storageConfigurationId: string;
  tone: EnvironmentCardTone;
};
