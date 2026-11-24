import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";

export type ApplicationSigning = APISchemas["ApplicationSigningResponse"];
export type SigningKey = APISchemas["SigningKey"];

export const applicationSigningQueryKey = (applicationSlug: string) =>
  ["application-signing", applicationSlug] as const;

const signingAPIErrorMessages: Record<string, string> = {
  "application not found": "应用不存在",
  forbidden: "当前账号无权限修改该应用的包签名配置",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid signing request": "签名配置参数无效",
  "signing key active": "生效中的密钥不能删除，请先生成新密钥",
  "signing key not found": "密钥不存在，可能已被删除",
  "signing key required": "请先生成签名密钥，再打开「只允许发布已签名的构建」",
};

export class ApplicationSigningAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    const error = payload?.error;
    super(
      (error && signingAPIErrorMessages[error]) || error || `Request ${path} failed with ${status}`,
    );
    this.name = "ApplicationSigningAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new ApplicationSigningAPIError(path, status, payload),
  { allowEmpty: true },
);

const signingPath = (applicationSlug: string) =>
  `/api/v1/applications/${encodeURIComponent(applicationSlug)}/signing`;

export function fetchApplicationSigning(applicationSlug: string) {
  return fetchJSON<ApplicationSigning>(signingPath(applicationSlug));
}

export function updateApplicationSigning(applicationSlug: string, requireSignedReleases: boolean) {
  return fetchJSON<ApplicationSigning>(signingPath(applicationSlug), {
    body: JSON.stringify({
      requireSignedReleases,
    } satisfies APISchemas["ApplicationSigningUpdateRequest"]),
    method: "PATCH",
  });
}

export function createSigningKey(applicationSlug: string) {
  return fetchJSON<SigningKey>(`${signingPath(applicationSlug)}/keys`, { method: "POST" });
}

export async function deleteSigningKey(applicationSlug: string, keyId: string) {
  await fetchJSON<void>(`${signingPath(applicationSlug)}/keys/${encodeURIComponent(keyId)}`, {
    method: "DELETE",
  });
}
