import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";
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

type EnvironmentsAPIResponse = APISchemas["EnvironmentsResponse"];

type EnvironmentDetailAPIResponse = APISchemas["EnvironmentDetailResponse"];

export class EnvironmentAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(getEnvironmentAPIErrorMessage(path, status, payload));
    this.name = "EnvironmentAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new EnvironmentAPIError(path, status, payload),
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

const environmentAPIErrorMessages: Record<string, string> = {
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid environment request": "环境参数无效，请检查表单",
  "storage configuration not found": "存储配置不存在",
};

function getEnvironmentAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  const error = payload?.error;
  if (error) {
    return environmentAPIErrorMessages[error] ?? error;
  }
  return `Request ${path} failed with ${status}`;
}
