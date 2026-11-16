import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";
import type {
  CodeSourceAppManifest,
  CodeSourceConnection,
  CodeSourceConnectionCreateRequest,
  CodeSourceConnectionUpdateRequest,
  CodeSourceInstallURL,
  CodeSourcesSnapshot,
} from "../types";

export const codeSourcesSnapshotQueryKey = ["code-sources-snapshot"] as const;

export const codeSourceConnectionsQueryKey = ["code-source-connections"] as const;

export class CodeSourceAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(getCodeSourceAPIErrorMessage(path, status, payload));
    this.name = "CodeSourceAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new CodeSourceAPIError(path, status, payload),
  { allowEmpty: true },
);

const codeSourceAPIErrorMessages: Record<string, string> = {
  "code source auth not configured": "代码源授权未配置",
  "code source authorization failed": "代码源授权失败",
  "code source connection already exists": "相同的代码源连接已存在",
  "code source connection is not active": "代码源连接已停用",
  "code source connection is referenced by modules": "仍有模块使用该连接",
  "code source connection not found": "代码源连接不存在",
  "code source credential is invalid": "凭证校验失败，请检查 Access Token 是否有效及权限范围",
  "code source installation not found": "代码源安装授权不存在",
  "code source provider not found": "代码源提供方不存在",
  "code source service unavailable": "代码源服务不可用",
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid code source request": "代码源参数无效",
};

export async function fetchCodeSourcesSnapshot(): Promise<CodeSourcesSnapshot> {
  const payload = await fetchJSON<APISchemas["CodeSourcesResponse"]>("/api/v1/code-sources");
  return { apps: payload.apps };
}

export async function fetchGitHubInstallURL(): Promise<CodeSourceInstallURL> {
  return fetchJSON<CodeSourceInstallURL>("/api/v1/code-sources/github/install-url");
}

export async function fetchGitHubAppManifest(): Promise<CodeSourceAppManifest> {
  return fetchJSON<CodeSourceAppManifest>("/api/v1/code-sources/github/manifest");
}

export async function fetchCodeSourceConnections(): Promise<CodeSourceConnection[]> {
  const payload = await fetchJSON<APISchemas["CodeSourceConnectionsResponse"]>(
    "/api/v1/code-source-connections",
  );
  return payload.connections;
}

export async function createCodeSourceConnection(
  input: CodeSourceConnectionCreateRequest,
): Promise<CodeSourceConnection> {
  const payload = await fetchJSON<APISchemas["CodeSourceConnectionDetailResponse"]>(
    "/api/v1/code-source-connections",
    { body: JSON.stringify(input), method: "POST" },
  );
  return payload.connection;
}

export async function updateCodeSourceConnection(
  id: string,
  input: CodeSourceConnectionUpdateRequest,
): Promise<CodeSourceConnection> {
  const payload = await fetchJSON<APISchemas["CodeSourceConnectionDetailResponse"]>(
    `/api/v1/code-source-connections/${encodeURIComponent(id)}`,
    { body: JSON.stringify(input), method: "PATCH" },
  );
  return payload.connection;
}

export async function verifyCodeSourceConnection(id: string): Promise<CodeSourceConnection> {
  const payload = await fetchJSON<APISchemas["CodeSourceConnectionDetailResponse"]>(
    `/api/v1/code-source-connections/${encodeURIComponent(id)}/verify`,
    { method: "POST" },
  );
  return payload.connection;
}

export async function deleteCodeSourceConnection(id: string): Promise<void> {
  await fetchJSON<void>(`/api/v1/code-source-connections/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

function getCodeSourceAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  const error = payload?.error;
  if (error) {
    return codeSourceAPIErrorMessages[error] ?? error;
  }
  return `Request ${path} failed with ${status}`;
}
