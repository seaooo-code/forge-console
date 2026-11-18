import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";

type SetupStatusResponse = APISchemas["SetupStatusResponse"];

export type SetupFeishuTenantInput = APISchemas["SetupFeishuTenantRequest"];

export const setupStatusQueryKey = ["auth", "setup-status"] as const;

const setupAPIErrorMessages: Record<string, string> = {
  "feishu tenant app id already exists": "这个 App ID 已经被使用",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid feishu tenant request": "参数无效：租户 ID 需小写字母开头，App ID 以 cli_ 开头",
  "invalid setup token": "初始化令牌不正确，请从服务启动日志里复制 setupToken",
  "platform setup already completed": "平台已经初始化过，请直接登录",
};

class SetupAPIError extends Error {
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    const error = payload?.error;
    super(
      status === 429
        ? "请求太频繁，请稍后再试"
        : error
          ? (setupAPIErrorMessages[error] ?? error)
          : `Request ${path} failed with ${status}`,
    );
    this.name = "SetupAPIError";
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new SetupAPIError(path, status, payload),
);

/** 平台是否还没有任何飞书租户，需要首次初始化。接口不需要登录。 */
export async function fetchSetupRequired(): Promise<boolean> {
  const payload = await fetchJSON<SetupStatusResponse>("/api/v1/setup/status");
  return payload.setupRequired;
}

/** 用启动日志里的初始化令牌创建第一个飞书租户。 */
export async function setupFirstFeishuTenant(input: SetupFeishuTenantInput) {
  await fetchJSON("/api/v1/setup/feishu-tenant", { body: JSON.stringify(input), method: "POST" });
}
