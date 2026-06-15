import type { StorageConfigRecord, StorageSnapshot } from "@/types/storage";
import type {
  EnvironmentCode,
  EnvironmentDetail,
  EnvironmentMutationInput,
  EnvironmentsSnapshot,
  RuntimeEnvironment,
} from "../types";

export {
  environmentEditQueryKey,
  environmentStorageOptionsQueryKey,
  environmentsSnapshotQueryKey,
} from "./environment-query-keys";

type EnvironmentsAPIResponse = {
  environments: RuntimeEnvironment[];
};

type EnvironmentDetailAPIResponse = {
  environment: RuntimeEnvironment;
};

type StorageConfigurationsAPIResponse = {
  configurations: StorageConfigRecord[];
};

type APIErrorPayload = {
  error?: string;
};

export class EnvironmentAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(payload?.error || `Request ${path} failed with ${status}`);
    this.name = "EnvironmentAPIError";
    this.payload = payload;
    this.status = status;
  }
}

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
  environmentId: string,
): Promise<EnvironmentsSnapshot> {
  const payload = await fetchJSON<EnvironmentDetailAPIResponse>(
    `/api/v1/environments/${encodeURIComponent(environmentId)}`,
  );
  const environment = normalizeEnvironment(payload.environment);

  return {
    details: {
      [environment.id]: environment,
    },
    environments: [environment],
  };
}

export async function fetchEnvironmentStorageSnapshot(): Promise<StorageSnapshot> {
  const payload = await fetchJSON<StorageConfigurationsAPIResponse>(
    "/api/v1/storage/configurations",
  );

  return {
    configurations: payload.configurations,
  };
}

export async function createEnvironment(
  input: EnvironmentMutationInput,
): Promise<RuntimeEnvironment> {
  const payload = await fetchJSON<EnvironmentDetailAPIResponse>("/api/v1/environments", {
    body: JSON.stringify(input),
    method: "POST",
  });

  return normalizeEnvironment(payload.environment);
}

export async function updateEnvironment(
  environmentId: string,
  input: EnvironmentMutationInput,
): Promise<RuntimeEnvironment> {
  const payload = await fetchJSON<EnvironmentDetailAPIResponse>(
    `/api/v1/environments/${encodeURIComponent(environmentId)}`,
    {
      body: JSON.stringify(input),
      method: "PATCH",
    },
  );

  return normalizeEnvironment(payload.environment);
}

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    credentials: "include",
    ...init,
    headers: init?.body
      ? {
          "Content-Type": "application/json",
          ...init.headers,
        }
      : init?.headers,
  });

  if (!response.ok) {
    const payload = await readErrorPayload(response);
    throw new EnvironmentAPIError(path, response.status, payload);
  }

  return response.json() as Promise<T>;
}

function normalizeEnvironment(environment: RuntimeEnvironment): RuntimeEnvironment {
  return {
    ...environment,
    id: String(environment.id),
    updatedAt: formatUpdatedAt(environment.updatedAt),
  };
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

async function readErrorPayload(response: Response): Promise<APIErrorPayload | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  try {
    return (await response.json()) as APIErrorPayload;
  } catch (_error) {
    return undefined;
  }
}
