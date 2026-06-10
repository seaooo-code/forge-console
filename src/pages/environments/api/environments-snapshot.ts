import { type MiCarEnvironmentCode, miCarEnvironmentCodes } from "@/types/environments";

import type {
  BundleVersionMatrixRow,
  EnvironmentBundleRow,
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
  detail: Omit<EnvironmentDetail, "bundles">;
};

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

const bundleVersionMatrix: BundleVersionMatrixRow[] = [
  {
    id: "common",
    moduleName: "common",
    moduleType: "Common Bundle",
    dev: "1.4.0-rc.2",
    staging: "1.3.5",
    preview: "1.3.5",
    preProduct: "1.3.5",
    product: "1.3.0",
  },
  {
    id: "home",
    moduleName: "home",
    moduleType: "Feature Bundle",
    dev: "2.6.0-rc.1",
    staging: "2.5.3",
    preview: "2.5.3",
    preProduct: "2.5.3",
    product: "2.5.1",
  },
  {
    id: "vehicle",
    moduleName: "vehicle",
    moduleType: "Feature Bundle",
    dev: "4.9.0-beta",
    staging: "4.8.5",
    preview: "4.8.5",
    preProduct: "4.8.5",
    product: "4.8.2",
  },
  {
    id: "ai-assistant",
    moduleName: "ai-assistant",
    moduleType: "Feature Bundle",
    dev: "2.0.0-rc.3",
    staging: "1.9.4",
    preview: "1.9.4",
    preProduct: "1.9.4",
    product: "1.9.0",
  },
  {
    id: "message",
    moduleName: "message",
    moduleType: "Feature Bundle",
    dev: "3.3.0-rc.1",
    staging: "3.2.6",
    preview: "3.2.6",
    preProduct: "3.2.6",
    product: "3.2.4",
  },
];

const moduleMeta: Record<
  string,
  Omit<EnvironmentBundleRow, "id" | "moduleName" | "moduleType" | "version" | "status">
> = {
  "ai-assistant": {
    branch: "release/1.9.4",
    build: "#4790",
    owner: "liu.qi",
    size: "498 KB",
  },
  common: {
    branch: "release/1.3.5",
    build: "#4789",
    owner: "li.ming",
    size: "278 KB",
  },
  home: {
    branch: "release/2.5.3",
    build: "#4795",
    owner: "chen.hao",
    size: "408 KB",
  },
  message: {
    branch: "release/3.2.6",
    build: "#4776",
    owner: "sun.yu",
    size: "356 KB",
  },
  vehicle: {
    branch: "release/4.8.5",
    build: "#4778",
    owner: "zhao.lei",
    size: "672 KB",
  },
};

export async function fetchEnvironmentsSnapshot(): Promise<EnvironmentsSnapshot> {
  const payload = await fetchJSON<EnvironmentsAPIResponse>("/api/v1/environments");
  const environments = payload.environments.map(normalizeEnvironment);

  return {
    details: {} as Record<EnvironmentCode, EnvironmentDetail>,
    environments,
    matrix: bundleVersionMatrix,
  };
}

export async function fetchEnvironmentDetailSnapshot(
  environmentId: EnvironmentCode,
): Promise<EnvironmentsSnapshot> {
  const payload = await fetchJSON<EnvironmentDetailAPIResponse>(
    `/api/v1/environments/${environmentId}`,
  );
  const environment = normalizeEnvironment(payload.environment);
  const detail = normalizeEnvironmentDetail(payload.detail);

  return {
    details: {
      [detail.id]: detail,
    } as Record<EnvironmentCode, EnvironmentDetail>,
    environments: [environment],
    matrix: bundleVersionMatrix,
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

function normalizeEnvironmentDetail(detail: Omit<EnvironmentDetail, "bundles">): EnvironmentDetail {
  const environmentId = toEnvironmentCode(detail.id);

  return {
    ...detail,
    bundles: createBundleRows(environmentId),
    id: environmentId,
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

function createBundleRows(environmentId: EnvironmentCode): EnvironmentBundleRow[] {
  return bundleVersionMatrix.map((row) => ({
    ...moduleMeta[row.id],
    id: row.id,
    moduleName: row.moduleName,
    moduleType: row.moduleType,
    status: environmentId === "product" ? "灰度中" : environmentId === "dev" ? "待验证" : "已验证",
    version: row[environmentId],
  }));
}
