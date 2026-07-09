import type { BuildReleaseInput } from "@/types/releases";

type ReleaseDetailAPIResponse = {
  release: {
    createdAt: string;
    id: string;
  };
};

type APIErrorPayload = {
  error?: string;
};

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

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

export async function createBuildRelease(input: BuildReleaseInput): Promise<string> {
  const payload = await fetchJSON<ReleaseDetailAPIResponse>("/api/v1/releases", {
    body: JSON.stringify({
      buildRecordId: input.buildRecordId,
      expiresAt:
        input.releaseType === "gray" && input.grayStrategy === "targeted"
          ? new Date(input.expiresAt).toISOString()
          : undefined,
      grayPercentage:
        input.releaseType === "gray" && input.grayStrategy === "percentage"
          ? input.grayPercentage
          : 0,
      grayStrategy: input.releaseType === "gray" ? input.grayStrategy : "",
      identifier:
        input.releaseType === "gray" && input.grayStrategy === "targeted"
          ? input.identifier.trim()
          : "",
      releaseType: input.releaseType,
    }),
    method: "POST",
  });

  return formatRecordNumber(payload.release.createdAt);
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
    throw new ReleaseAPIError(path, response.status, payload);
  }

  return response.json() as Promise<T>;
}

const releaseAPIErrorMessages: Record<string, string> = {
  "build record not found": "构建记录不存在",
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid release request": "发布参数无效，请确认构建状态、发布类型和灰度配置",
  "release already active": "该构建已是当前发布目标的生效版本，没有新的路由变化",
  "release route not found": "发布路由不存在",
  "release service unavailable": "发布服务暂不可用",
};

function getReleaseAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  const error = payload?.error;
  if (error && releaseAPIErrorMessages[error]) {
    return releaseAPIErrorMessages[error];
  }
  return error ?? `Request ${path} failed with ${status}`;
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
