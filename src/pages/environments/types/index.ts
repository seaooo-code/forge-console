import type { APISchemas } from "@/api/client";

export type EnvironmentCode = string;

export type RuntimeEnvironment = APISchemas["Environment"];

export type EnvironmentStatus = RuntimeEnvironment["status"];

export type EnvironmentStatusCode = APISchemas["EnvironmentCreateRequest"]["status"];

export type EnvironmentCardTone = RuntimeEnvironment["tone"];

export type EnvironmentDetail = RuntimeEnvironment;

export type EnvironmentsSnapshot = {
  environments: RuntimeEnvironment[];
  details: Record<EnvironmentCode, EnvironmentDetail>;
};

export type EnvironmentMutationInput = APISchemas["EnvironmentCreateRequest"];

export type EnvironmentFormState = {
  allowTestPlans: boolean;
  code: string;
  description: string;
  name: string;
  status: EnvironmentStatusCode;
  storageConfigurationId: string;
  tone: EnvironmentCardTone;
};
