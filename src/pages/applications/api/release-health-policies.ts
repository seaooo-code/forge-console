import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";

export type ReleaseHealthPolicy = APISchemas["ReleaseHealthPolicy"];
export type ReleaseHealthPolicyInput = APISchemas["ReleaseHealthPolicyRequest"];

export const releaseHealthPoliciesQueryKey = (applicationSlug: string) =>
  ["release-health-policies", applicationSlug] as const;

const policyAPIErrorMessages: Record<string, string> = {
  "application not found": "应用不存在",
  "environment not found": "该环境没有绑定到应用",
  forbidden: "当前账号无权限修改该应用的健康策略",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid release health request": "策略参数超出范围，请检查窗口、用户数和比例",
};

export class ReleaseHealthPolicyAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    const error = payload?.error;
    super(
      (error && policyAPIErrorMessages[error]) || error || `Request ${path} failed with ${status}`,
    );
    this.name = "ReleaseHealthPolicyAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new ReleaseHealthPolicyAPIError(path, status, payload),
);

const policiesPath = (applicationSlug: string) =>
  `/api/v1/applications/${encodeURIComponent(applicationSlug)}/release-health-policies`;

export async function fetchReleaseHealthPolicies(applicationSlug: string) {
  const payload = await fetchJSON<APISchemas["ReleaseHealthPoliciesResponse"]>(
    policiesPath(applicationSlug),
  );
  return payload.policies;
}

export async function updateReleaseHealthPolicy(
  applicationSlug: string,
  environment: string,
  input: ReleaseHealthPolicyInput,
) {
  const payload = await fetchJSON<APISchemas["ReleaseHealthPoliciesResponse"]>(
    `${policiesPath(applicationSlug)}/${encodeURIComponent(environment)}`,
    { body: JSON.stringify(input), method: "PUT" },
  );
  return payload.policies;
}
