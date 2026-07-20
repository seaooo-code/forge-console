import { type APIErrorPayload, createFetchClient } from "@/api/client";
import type {
  CodeSourceAppManifest,
  CodeSourceInstallURL,
  CodeSourceProvider,
  CodeSourcesSnapshot,
} from "../types";

export const codeSourcesSnapshotQueryKey = ["code-sources-snapshot"] as const;

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
  "code source installation not found": "代码源安装授权不存在",
  "code source provider not found": "代码源提供方不存在",
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid code source request": "代码源参数无效",
};

export async function fetchCodeSourcesSnapshot(): Promise<CodeSourcesSnapshot> {
  const payload = await fetchJSON<CodeSourcesSnapshot>("/api/v1/code-sources");

  return {
    apps: payload.apps.map((app) => ({
      ...app,
      installedAt: formatInstalledAt(app.installedAt),
    })),
  };
}

export async function fetchCodeSourceInstallURL(
  provider: CodeSourceProvider,
): Promise<CodeSourceInstallURL> {
  return fetchJSON<CodeSourceInstallURL>(
    `/api/v1/code-sources/${encodeURIComponent(provider)}/install-url`,
  );
}

export async function fetchCodeSourceAppManifest(
  provider: CodeSourceProvider,
): Promise<CodeSourceAppManifest> {
  return fetchJSON<CodeSourceAppManifest>(
    `/api/v1/code-sources/${encodeURIComponent(provider)}/manifest`,
  );
}

export async function deleteCodeSourceInstallations(provider: CodeSourceProvider): Promise<void> {
  await fetchJSON<void>(`/api/v1/code-sources/${encodeURIComponent(provider)}/installations`, {
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

function formatInstalledAt(value?: string) {
  if (!value) {
    return undefined;
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
