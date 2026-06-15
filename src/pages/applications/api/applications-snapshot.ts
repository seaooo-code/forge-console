import type {
  ApplicationDetail,
  ApplicationEnvironmentRecord,
  ApplicationListFilters,
  ApplicationMemberRecord,
  ApplicationMutationInput,
  ApplicationOptions,
  ApplicationsSnapshot,
  HostApplication,
} from "../types";
import { normalizeApplicationListFilters } from "./application-list-filters";

export {
  applicationDetailQueryKey,
  applicationEditQueryKey,
  applicationsSnapshotQueryKey,
  emptyApplicationListFilters,
  normalizeApplicationListFilters,
} from "./application-list-filters";

type ApplicationsAPIResponse = {
  applications: HostApplication[];
  summary: ApplicationsSnapshot["summary"];
};

export type ApplicationDetailAPIResponse = {
  application: HostApplication;
  detail: ApplicationDetail;
};

type APIErrorPayload = {
  error?: string;
  feishuCode?: number;
  feishuEndpoint?: string;
  feishuMsg?: string;
};

export class ForgeAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(buildAPIErrorMessage(path, status, payload));
    this.name = "ForgeAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

export async function fetchApplicationsSnapshot(
  filters?: Partial<ApplicationListFilters>,
): Promise<ApplicationsSnapshot> {
  const payload = await fetchJSON<ApplicationsAPIResponse>(buildApplicationsSnapshotPath(filters));
  const applications = payload.applications.map(normalizeApplication);

  return {
    applications,
    details: {},
    summary: payload.summary,
  };
}

export async function fetchApplicationOptions(): Promise<ApplicationOptions> {
  return fetchJSON<ApplicationOptions>("/api/v1/applications/options");
}

export async function fetchApplicationDetailSnapshot(
  applicationSlug: string,
): Promise<ApplicationsSnapshot> {
  const payload = await fetchJSON<ApplicationDetailAPIResponse>(
    `/api/v1/applications/${applicationSlug}`,
  );
  const application = normalizeApplication(payload.application);
  const detail = normalizeApplicationDetail(payload.detail);

  return {
    applications: [application],
    details: {
      [application.slug]: detail,
    },
    summary: {
      maintenance: application.status === "维护中" ? 1 : 0,
      offline: application.status === "已下线" ? 1 : 0,
      running: application.status === "运行中" ? 1 : 0,
      total: 1,
    },
  };
}

export async function createApplication(
  input: ApplicationMutationInput,
): Promise<ApplicationDetailAPIResponse> {
  return normalizeApplicationDetailPayload(
    await fetchJSON<ApplicationDetailAPIResponse>("/api/v1/applications", {
      body: JSON.stringify(input),
      method: "POST",
    }),
  );
}

export async function updateApplication(
  applicationSlug: string,
  input: ApplicationMutationInput,
): Promise<ApplicationDetailAPIResponse> {
  const { slug: _slug, ...payload } = input;

  return normalizeApplicationDetailPayload(
    await fetchJSON<ApplicationDetailAPIResponse>(`/api/v1/applications/${applicationSlug}`, {
      body: JSON.stringify(payload),
      method: "PATCH",
    }),
  );
}

export async function deleteApplication(
  applicationSlug: string,
): Promise<ApplicationDetailAPIResponse> {
  return normalizeApplicationDetailPayload(
    await fetchJSON<ApplicationDetailAPIResponse>(`/api/v1/applications/${applicationSlug}`, {
      method: "DELETE",
    }),
  );
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
    throw new ForgeAPIError(path, response.status, payload);
  }

  return response.json() as Promise<T>;
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

function buildAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  if (payload?.feishuMsg) {
    return payload.feishuCode
      ? `飞书错误 ${payload.feishuCode}: ${payload.feishuMsg}`
      : payload.feishuMsg;
  }
  if (payload?.error) {
    return payload.error;
  }
  return `Request ${path} failed with ${status}`;
}

function buildApplicationsSnapshotPath(filters?: Partial<ApplicationListFilters>) {
  const normalizedFilters = normalizeApplicationListFilters(filters);
  const params = new URLSearchParams();

  if (normalizedFilters.platform) {
    params.set("platform", normalizedFilters.platform);
  }
  if (normalizedFilters.status) {
    params.set("status", normalizedFilters.status);
  }
  if (normalizedFilters.owner) {
    params.set("owner", normalizedFilters.owner);
  }
  if (normalizedFilters.keyword) {
    params.set("keyword", normalizedFilters.keyword);
  }

  const query = params.toString();

  return query ? `/api/v1/applications?${query}` : "/api/v1/applications";
}

function normalizeApplicationDetailPayload(
  payload: ApplicationDetailAPIResponse,
): ApplicationDetailAPIResponse {
  const application = normalizeApplication(payload.application);

  return {
    application,
    detail: normalizeApplicationDetail(payload.detail),
  };
}

function normalizeApplication(application: HostApplication): HostApplication {
  return {
    ...application,
    createdAt: formatDate(application.createdAt),
    ownerAvatarUrl: application.ownerAvatarUrl ?? "",
    ownerDepartmentIds: application.ownerDepartmentIds ?? [],
    ownerEmail: application.ownerEmail ?? "",
  };
}

function normalizeApplicationDetail(detail: ApplicationDetail): ApplicationDetail {
  return {
    ...detail,
    environments: detail.environments.map(normalizeApplicationEnvironment),
    members: detail.members.map(normalizeApplicationMember),
    modules: detail.modules ?? [],
    owner: detail.owner ?? "",
    ownerAvatarUrl: detail.ownerAvatarUrl ?? "",
    ownerDepartmentIds: detail.ownerDepartmentIds ?? [],
    ownerEmail: detail.ownerEmail ?? "",
    pipelines: detail.pipelines ?? [],
  };
}

function normalizeApplicationEnvironment(
  environment: ApplicationEnvironmentRecord,
): ApplicationEnvironmentRecord {
  return {
    ...environment,
    updatedAt: formatUpdatedAt(environment.updatedAt),
  };
}

function normalizeApplicationMember(member: ApplicationMemberRecord): ApplicationMemberRecord {
  return {
    ...member,
    team: member.team || "-",
  };
}

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
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
