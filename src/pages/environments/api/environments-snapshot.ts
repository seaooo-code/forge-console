import { type MiCarEnvironmentCode, miCarEnvironmentCodes } from "@/types/environments";

import type {
  EnvironmentCode,
  EnvironmentDetail,
  EnvironmentsSnapshot,
  RuntimeEnvironment,
} from "../types";

export const environmentsSnapshotQueryKey = ["environments"] as const;

export const environmentDetailQueryKey = (environmentId: EnvironmentCode) =>
  ["environments", "detail", environmentId] as const;

type EnvironmentsAPIResponse = {
  environments: RuntimeEnvironment[];
};

type EnvironmentDetailAPIResponse = {
  environment: RuntimeEnvironment;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

export async function fetchEnvironmentsSnapshot(): Promise<EnvironmentsSnapshot> {
  const payload = await fetchJSON<EnvironmentsAPIResponse>("/api/v1/environments");
  const environments = payload.environments.map(normalizeEnvironment);

  return {
    details: {} as Record<EnvironmentCode, EnvironmentDetail>,
    environments,
  };
}

export async function fetchEnvironmentDetailSnapshot(
  environmentId: EnvironmentCode,
): Promise<EnvironmentsSnapshot> {
  const payload = await fetchJSON<EnvironmentDetailAPIResponse>(
    `/api/v1/environments/${environmentId}`,
  );
  const environment = normalizeEnvironment(payload.environment);

  return {
    details: {
      [environment.id]: environment,
    } as Record<EnvironmentCode, EnvironmentDetail>,
    environments: [environment],
  };
}

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`);

  if (!response.ok) {
    throw new Error(`Request ${path} failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function normalizeEnvironment(environment: RuntimeEnvironment): RuntimeEnvironment {
  return {
    ...environment,
    id: toEnvironmentCode(environment.id),
    updatedAt: formatUpdatedAt(environment.updatedAt),
  };
}

function toEnvironmentCode(value: string): EnvironmentCode {
  if (miCarEnvironmentCodes.includes(value as MiCarEnvironmentCode)) {
    return value as EnvironmentCode;
  }

  throw new Error(`Unsupported environment code: ${value}`);
}

function formatUpdatedAt(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(date);
}
