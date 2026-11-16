import { credentialExpiryWarningDays } from "../constants";
import type {
  CodeSourceConnection,
  CodeSourceConnectionCreateRequest,
  CodeSourceConnectionUpdateRequest,
  CredentialExpiryLevel,
  GitLabConnectionFormValues,
} from "../types";

const dayMilliseconds = 24 * 60 * 60 * 1000;

export function getCredentialExpiryLevel(value?: string, now = Date.now()): CredentialExpiryLevel {
  if (!value) {
    return "none";
  }
  const time = Date.parse(value);
  if (!Number.isFinite(time)) {
    return "none";
  }
  if (time <= now) {
    return "expired";
  }
  return time - now <= credentialExpiryWarningDays * dayMilliseconds ? "expiring" : "none";
}

export function formatDisplayTime(value?: string) {
  if (!value) {
    return "-";
  }
  const time = Date.parse(value);
  if (!Number.isFinite(time)) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(time));
}

/** 校验实例地址：与后端一致，只接受不带账号、查询串和锚点的 http(s) 地址。 */
export function validateInstanceURL(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "请输入实例地址";
  }
  try {
    const parsed = new URL(trimmed);
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      return "请输入 http(s) 地址，不要包含账号、查询参数或锚点";
    }
  } catch {
    return "实例地址格式不正确";
  }
  return true;
}

export function buildGitLabCreatePayload(
  form: GitLabConnectionFormValues,
): CodeSourceConnectionCreateRequest {
  return {
    credential: form.credential.trim(),
    name: form.name.trim(),
    provider: "gitlab",
    webBaseUrl: form.webBaseUrl.trim().replace(/\/+$/, ""),
  };
}

/** 编辑时只提交变化的字段；Access Token 留空表示沿用原凭证。 */
export function buildGitLabUpdatePayload(
  form: GitLabConnectionFormValues,
  connection: CodeSourceConnection,
): CodeSourceConnectionUpdateRequest {
  const payload: CodeSourceConnectionUpdateRequest = {};
  const name = form.name.trim();
  const credential = form.credential.trim();
  if (name !== connection.name) {
    payload.name = name;
  }
  if (credential) {
    payload.credential = credential;
  }
  return payload;
}
