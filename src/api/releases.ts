import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";
import type { BuildReleaseInput } from "@/types/releases";

type ReleaseDetailAPIResponse = APISchemas["ReleaseDetailResponse"];
type ReleaseConflictPayload = APISchemas["ReleaseConflictErrorResponse"];

export class ReleaseAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(getReleaseAPIErrorMessage(path, status, payload));
    this.name = "ReleaseAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new ReleaseAPIError(path, status, payload),
);

export async function createBuildRelease(input: BuildReleaseInput): Promise<string> {
  const payload = await fetchJSON<ReleaseDetailAPIResponse>("/api/v1/releases", {
    body: JSON.stringify({
      buildRecordId: input.buildRecordId,
      channel: input.channel,
      grayPercentage: input.releaseType === "gray" ? input.grayPercentage : 0,
      grayStrategy: input.releaseType === "gray" ? "percentage" : "",
      releaseType: input.releaseType,
    }),
    method: "POST",
  });

  return formatRecordNumber(payload.release.createdAt);
}

const releaseAPIErrorMessages: Record<string, string> = {
  "build record not found": "构建记录不存在",
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid release request": "发布参数无效，请确认构建状态、发布类型和灰度配置",
  "release already active": "该构建已是当前发布目标的生效版本，没有新的路由变化",
  "release channel not found": "发布渠道不存在，可能已被删除，请刷新后重试",
  "release not active": "这条发布已经失效",
  "release rollback unavailable": "没有可以回滚的上一次全量发布",
  "release route not found": "发布路由不存在",
  "release service unavailable": "发布服务暂不可用",
};

/**
 * 把发布能力冲突（409 release capability conflict）转成可读文案，例如
 * "与 common #12（全量）不兼容：commonApi 需要 ≥ 3，对方提供 2"。不是能力冲突时返回空字符串。
 */
export function describeReleaseCapabilityConflict(payload?: APIErrorPayload) {
  const conflicts = (payload as ReleaseConflictPayload | undefined)?.conflicts;
  if (payload?.error !== "release capability conflict" || !conflicts?.length) {
    return "";
  }
  const lines = conflicts.map((conflict) => {
    const shortfalls = conflict.shortfalls
      .map(
        (item) =>
          `${item.name} 需要 ≥ ${item.required}，${item.provided === null || item.provided === undefined ? "未声明" : `对方提供 ${item.provided}`}`,
      )
      .join("；");
    if (conflict.reason === "common_missing") {
      return `${conflict.moduleName} 在该环境和运行时版本下没有生效中的发布（${shortfalls}）`;
    }
    const target = `${conflict.moduleName} #${conflict.buildNumber}（${conflict.releaseType === "gray" ? "比例灰度" : "全量"}）`;
    return `与 ${target} 不兼容：${shortfalls}`;
  });
  return `Common 与业务包能力不兼容，发布被拒绝。${lines.join("。")}`;
}

function getReleaseAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  const capabilityConflict = describeReleaseCapabilityConflict(payload);
  if (capabilityConflict) {
    return capabilityConflict;
  }
  const error = payload?.error;
  if (error && releaseAPIErrorMessages[error]) {
    return releaseAPIErrorMessages[error];
  }
  return error ?? `Request ${path} failed with ${status}`;
}

function formatRecordNumber(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  const second = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
