import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";

import type { TestPlanListFilters } from "../types";

export type TestPlanRecord = APISchemas["TestPlan"];
export type TestPlanItemRecord = APISchemas["TestPlanItem"];
export type TestPlanMemberRecord = APISchemas["TestPlanMember"];
export type TestPlanEventRecord = APISchemas["TestPlanEvent"];
export type TestPlanDetail = APISchemas["TestPlanDetailResponse"];
export type TestPlanMutationResult = APISchemas["TestPlanMutationResponse"];
export type TestPlanMemberConflict = APISchemas["TestPlanMemberConflict"];
export type TestPlanRef = APISchemas["TestPlanRef"];
export type TestAccountRecord = APISchemas["TestAccount"];

type TestPlanErrorPayload = APIErrorPayload & Partial<APISchemas["TestPlanConflictErrorResponse"]>;

export class TestPlanAPIError extends Error {
  readonly payload?: TestPlanErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: TestPlanErrorPayload) {
    super(testPlanErrorMessage(path, status, payload));
    this.name = "TestPlanAPIError";
    this.payload = payload;
    this.status = status;
  }

  /** 写操作会造成成员冲突、且请求没有确认移出时，返回冲突清单。 */
  get memberConflicts(): TestPlanMemberConflict[] | null {
    return this.payload?.error === "test plan member conflict"
      ? (this.payload.conflicts ?? [])
      : null;
  }
}

const testPlanErrorMessages: Record<string, string> = {
  forbidden: "当前账号没有该应用的提测单管理权限",
  "invalid test plan request": "提测单参数不合法",
  "test plan build not found": "该分支在这个环境下还没有可用的成功构建",
  "test plan closed": "提测单已关闭或已过期，不能再修改",
  "test plan member limit exceeded": "提测单成员超过上限",
  "test plan not found": "提测单不存在",
  "test plans disabled for environment": "该环境没有开启「允许提测单」，请先在环境设置里开启",
  "test account not found": "没有找到对应的测试账号，请先在「我的测试账号」里添加",
  "test plan member not found": "成员不存在",
  "test plan item not found": "条目不存在",
  "module not found": "模块不存在",
};

function testPlanErrorMessage(path: string, status: number, payload?: TestPlanErrorPayload) {
  if (payload?.error === "test plan branch in use") {
    return `分支 ${payload.branch ?? ""} 已被进行中的提测单「${payload.testPlan?.name ?? ""}」占用`;
  }
  if (payload?.error === "test plan member conflict") {
    return "部分成员已在其他提测单里测试同一模块";
  }
  const message = payload?.error ? testPlanErrorMessages[payload.error] : undefined;
  return message ?? payload?.error ?? `请求 ${path} 失败：${status}`;
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new TestPlanAPIError(path, status, payload as TestPlanErrorPayload),
  { allowEmpty: true },
);

export const testPlansRootQueryKey = ["test-plans"] as const;
export const testPlansQueryKey = (filters: TestPlanListFilters) =>
  [...testPlansRootQueryKey, "list", filters] as const;
export const testPlanDetailQueryKey = (id: string) =>
  [...testPlansRootQueryKey, "detail", id] as const;
export const testAccountsQueryKey = ["test-plans", "my-accounts"] as const;

export async function fetchTestPlans(filters: TestPlanListFilters) {
  const params = new URLSearchParams();
  if (filters.applicationId) params.set("applicationId", filters.applicationId);
  if (filters.environment) params.set("environment", filters.environment);
  if (filters.status) params.set("status", filters.status);
  params.set("page", "1");
  params.set("pageSize", "100");
  return fetchJSON<APISchemas["TestPlansResponse"]>(`/api/v1/test-plans?${params.toString()}`);
}

export function fetchTestPlanDetail(id: string) {
  return fetchJSON<TestPlanDetail>(`/api/v1/test-plans/${encodeURIComponent(id)}`);
}

export function createTestPlan(input: APISchemas["TestPlanCreateRequest"]) {
  return fetchJSON<TestPlanMutationResult>("/api/v1/test-plans", {
    body: JSON.stringify(input),
    method: "POST",
  });
}

export function updateTestPlan(id: string, input: APISchemas["TestPlanUpdateRequest"]) {
  return fetchJSON<TestPlanDetail>(`/api/v1/test-plans/${encodeURIComponent(id)}`, {
    body: JSON.stringify(input),
    method: "PATCH",
  });
}

export function closeTestPlan(id: string) {
  return fetchJSON<TestPlanDetail>(`/api/v1/test-plans/${encodeURIComponent(id)}/close`, {
    method: "POST",
  });
}

export function extendTestPlan(id: string, expiresAt: string) {
  return fetchJSON<TestPlanDetail>(`/api/v1/test-plans/${encodeURIComponent(id)}/extend`, {
    body: JSON.stringify({ expiresAt }),
    method: "POST",
  });
}

export function setTestPlanItem(
  id: string,
  moduleId: string,
  input: APISchemas["TestPlanItemSetRequest"],
) {
  return fetchJSON<TestPlanMutationResult>(
    `/api/v1/test-plans/${encodeURIComponent(id)}/items/${encodeURIComponent(moduleId)}`,
    { body: JSON.stringify(input), method: "PUT" },
  );
}

export function deleteTestPlanItem(id: string, moduleId: string) {
  return fetchJSON<TestPlanDetail>(
    `/api/v1/test-plans/${encodeURIComponent(id)}/items/${encodeURIComponent(moduleId)}`,
    { method: "DELETE" },
  );
}

export function addTestPlanMembers(id: string, input: APISchemas["TestPlanMembersAddRequest"]) {
  return fetchJSON<TestPlanMutationResult>(`/api/v1/test-plans/${encodeURIComponent(id)}/members`, {
    body: JSON.stringify(input),
    method: "POST",
  });
}

export function removeTestPlanMember(id: string, userId: string) {
  return fetchJSON<TestPlanDetail>(
    `/api/v1/test-plans/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}

export function joinTestPlan(id: string, input: APISchemas["TestPlanJoinRequest"]) {
  return fetchJSON<TestPlanMutationResult>(`/api/v1/test-plans/${encodeURIComponent(id)}/join`, {
    body: JSON.stringify(input),
    method: "POST",
  });
}

export function leaveTestPlan(id: string, input: APISchemas["TestPlanLeaveRequest"]) {
  return fetchJSON<TestPlanDetail>(`/api/v1/test-plans/${encodeURIComponent(id)}/leave`, {
    body: JSON.stringify(input),
    method: "POST",
  });
}

export async function fetchMyTestAccounts() {
  const payload = await fetchJSON<APISchemas["TestAccountsResponse"]>("/api/v1/me/test-accounts");
  return payload.testAccounts;
}

export function saveMyTestAccount(input: APISchemas["TestAccountRequest"]) {
  return fetchJSON<TestAccountRecord>("/api/v1/me/test-accounts", {
    body: JSON.stringify(input),
    method: "POST",
  });
}

export function deleteMyTestAccount(environment: string, userId: string) {
  return fetchJSON<void>(
    `/api/v1/me/test-accounts/${encodeURIComponent(environment)}/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}
