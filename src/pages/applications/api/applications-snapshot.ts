import { type APISchemas, createFetchClient } from "@/api/client";
import { fetchAllPaginatedItems } from "@/api/pagination";

import {
  applicationEnvironmentStatusLabelByCode,
  applicationStatusLabelByCode,
} from "../constants";
import type {
  ApplicationCapabilities,
  ApplicationDeleteCheck,
  ApplicationDetail,
  ApplicationEnvironmentRecord,
  ApplicationListFilters,
  ApplicationListRequest,
  ApplicationMemberInput,
  ApplicationMemberRecord,
  ApplicationMutationInput,
  ApplicationOptions,
  ApplicationsSnapshot,
  HostApplication,
} from "../types";
import { normalizeApplicationListFilters } from "./application-list-filters";

export {
  applicationDeleteCheckQueryKey,
  applicationDetailQueryKey,
  applicationEditQueryKey,
  applicationsSnapshotQueryKey,
  normalizeApplicationListFilters,
} from "./application-list-filters";

type ApplicationsAPIResponse = APISchemas["ApplicationsResponse"];

export type ApplicationDetailAPIResponse = {
  application: HostApplication;
  detail: ApplicationDetail;
};

type ApplicationAPIRecord = APISchemas["Application"];

type ApplicationDetailRawAPIResponse = APISchemas["ApplicationDetailResponse"];

type ApplicationMemberAPIResponse = APISchemas["ApplicationMember"];

type ApplicationAPIErrorPayload = Partial<APISchemas["ErrorResponse"]>;

export class ForgeAPIError extends Error {
  readonly payload?: ApplicationAPIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: ApplicationAPIErrorPayload) {
    super(buildAPIErrorMessage(path, status, payload));
    this.name = "ForgeAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new ForgeAPIError(path, status, payload),
  { allowEmpty: true },
);

export async function fetchApplicationsSnapshot(
  filters?: Partial<ApplicationListRequest>,
): Promise<ApplicationsSnapshot> {
  const payload = await fetchJSON<ApplicationsAPIResponse>(buildApplicationsSnapshotPath(filters));
  const applications = payload.applications.map(normalizeApplication);

  return {
    applications,
    details: {},
    pagination: payload.pagination,
    summary: payload.summary,
  };
}

export async function fetchAllApplicationsSnapshot(
  filters?: Partial<ApplicationListFilters>,
): Promise<ApplicationsSnapshot> {
  const { items, snapshot } = await fetchAllPaginatedItems(
    (pagination) => fetchApplicationsSnapshot({ ...filters, ...pagination }),
    (pageSnapshot) => pageSnapshot.applications,
  );

  return {
    ...snapshot,
    applications: items,
  };
}

export async function fetchApplicationOptions(): Promise<ApplicationOptions> {
  return fetchJSON<ApplicationOptions>("/api/v1/applications/options");
}

export async function fetchApplicationDetailSnapshot(
  applicationSlug: string,
): Promise<ApplicationsSnapshot> {
  const payload = await fetchJSON<ApplicationDetailRawAPIResponse>(
    `/api/v1/applications/${encodeURIComponent(applicationSlug)}`,
  );
  const application = normalizeApplication(payload.application);
  const detail = normalizeApplicationDetail(payload.detail);

  return {
    applications: [application],
    details: {
      [application.slug]: detail,
    },
    pagination: {
      page: 1,
      pageSize: 1,
      total: 1,
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
    await fetchJSON<ApplicationDetailRawAPIResponse>("/api/v1/applications", {
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
  const body: APISchemas["ApplicationUpdateRequest"] = payload;

  return normalizeApplicationDetailPayload(
    await fetchJSON<ApplicationDetailRawAPIResponse>(
      `/api/v1/applications/${encodeURIComponent(applicationSlug)}`,
      {
        body: JSON.stringify(body),
        method: "PATCH",
      },
    ),
  );
}

export async function updateApplicationStatus(
  applicationSlug: string,
  status: APISchemas["ApplicationStatusUpdateRequest"]["status"],
): Promise<ApplicationDetailAPIResponse> {
  return normalizeApplicationDetailPayload(
    await fetchJSON<ApplicationDetailRawAPIResponse>(
      `/api/v1/applications/${encodeURIComponent(applicationSlug)}/status`,
      {
        body: JSON.stringify({ status } satisfies APISchemas["ApplicationStatusUpdateRequest"]),
        method: "PATCH",
      },
    ),
  );
}

export async function fetchApplicationDeleteCheck(
  applicationSlug: string,
): Promise<ApplicationDeleteCheck> {
  return fetchJSON<ApplicationDeleteCheck>(
    `/api/v1/applications/${encodeURIComponent(applicationSlug)}/delete-check`,
  );
}

export async function deleteApplication(applicationSlug: string): Promise<void> {
  await fetchJSON<void>(`/api/v1/applications/${encodeURIComponent(applicationSlug)}`, {
    method: "DELETE",
  });
}

export async function upsertApplicationMember(
  applicationSlug: string,
  input: ApplicationMemberInput,
): Promise<ApplicationMemberRecord> {
  const payload = await fetchJSON<ApplicationMemberAPIResponse>(
    `/api/v1/applications/${encodeURIComponent(applicationSlug)}/members`,
    {
      body: JSON.stringify(input),
      method: "POST",
    },
  );
  return normalizeApplicationMember(payload);
}

export async function updateApplicationMemberRole(
  applicationSlug: string,
  userId: string,
  role: APISchemas["ApplicationMemberRoleUpdateRequest"]["role"],
): Promise<ApplicationMemberRecord> {
  const payload = await fetchJSON<ApplicationMemberAPIResponse>(
    `/api/v1/applications/${encodeURIComponent(applicationSlug)}/members/${encodeURIComponent(
      userId,
    )}`,
    {
      body: JSON.stringify({ role } satisfies APISchemas["ApplicationMemberRoleUpdateRequest"]),
      method: "PATCH",
    },
  );
  return normalizeApplicationMember(payload);
}

export async function deleteApplicationMember(
  applicationSlug: string,
  userId: string,
): Promise<void> {
  await fetchJSON<void>(
    `/api/v1/applications/${encodeURIComponent(applicationSlug)}/members/${encodeURIComponent(
      userId,
    )}`,
    {
      method: "DELETE",
    },
  );
}

function buildAPIErrorMessage(path: string, status: number, payload?: ApplicationAPIErrorPayload) {
  if (payload?.feishuMsg) {
    return payload.feishuCode
      ? `飞书错误 ${payload.feishuCode}: ${payload.feishuMsg}`
      : payload.feishuMsg;
  }
  if (payload?.error) {
    return applicationAPIErrorMessages[payload.error] ?? payload.error;
  }
  return `Request ${path} failed with ${status}`;
}

const applicationAPIErrorMessages: Record<string, string> = {
  "application is referenced by modules": "应用已被模块引用，不能删除",
  "application last owner": "不能移除应用最后一个 Owner",
  "application not found": "应用不存在",
  "application slug already exists": "应用标识已存在，请更换后重试",
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid application request": "应用参数无效，请检查表单",
};

function buildApplicationsSnapshotPath(filters?: Partial<ApplicationListRequest>) {
  const normalizedFilters = normalizeApplicationListFilters(filters);
  const params = new URLSearchParams();

  params.set("page", String(normalizedFilters.page));
  params.set("pageSize", String(normalizedFilters.pageSize));

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
  payload: ApplicationDetailRawAPIResponse,
): ApplicationDetailAPIResponse {
  const application = normalizeApplication(payload.application);

  return {
    application,
    detail: normalizeApplicationDetail(payload.detail),
  };
}

function normalizeApplication(application: ApplicationAPIRecord): HostApplication {
  return {
    ...application,
    createdAt: formatDate(application.createdAt),
    status: applicationStatusLabelByCode[application.status],
  };
}

function normalizeApplicationDetail(detail: APISchemas["ApplicationDetail"]): ApplicationDetail {
  return {
    ...detail,
    capabilities: normalizeApplicationCapabilities(detail.capabilities),
    environments: detail.environments.map(normalizeApplicationEnvironment),
    members: detail.members.map(normalizeApplicationMember),
  };
}

function normalizeApplicationCapabilities(
  capabilities?: Partial<ApplicationCapabilities>,
): ApplicationCapabilities {
  return {
    canCreateBuild: Boolean(capabilities?.canCreateBuild),
    canEditApplication: Boolean(capabilities?.canEditApplication),
    canManageMembers: Boolean(capabilities?.canManageMembers),
    canManageTestPlans: Boolean(capabilities?.canManageTestPlans),
    canRelease: Boolean(capabilities?.canRelease),
    canUpdateStatus: Boolean(capabilities?.canUpdateStatus),
  };
}

function normalizeApplicationEnvironment(
  environment: APISchemas["ApplicationEnvironment"],
): ApplicationEnvironmentRecord {
  return {
    ...environment,
    status: applicationEnvironmentStatusLabelByCode[environment.status],
    updatedAt: formatUpdatedAt(environment.updatedAt),
  };
}

function normalizeApplicationMember(member: ApplicationMemberRecord): ApplicationMemberRecord {
  return {
    avatarUrl: member.avatarUrl || "",
    email: member.email || "",
    id: member.id || member.userId,
    name: member.name || member.userId,
    role: member.role,
    team: member.team || "",
    userId: member.userId || member.id,
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
