import { type APISchemas, createFetchClient } from "@/api/client";
import type {
  BuildAdapter,
  BuildAdapterRenderPreview,
  BuildAdapterRenderPreviewRequest,
  BuildAdapterStatus,
} from "@/types/build-adapters";

export const buildAdaptersRootQueryKey = ["build-adapters"] as const;

export const buildAdaptersQueryKey = (status: BuildAdapterStatus | "" = "") =>
  [...buildAdaptersRootQueryKey, "list", status] as const;

export const buildAdapterDetailQueryKey = (adapterId: string | undefined) =>
  [...buildAdaptersRootQueryKey, "detail", adapterId ?? "none"] as const;

type BuildAdapterErrorBody = Partial<APISchemas["BuildAdapterErrorResponse"]>;

/** 保存适配器失败时后端会带上出错的模板名和行号，界面据此在编辑器旁标注。 */
export class BuildAdapterAPIError extends Error {
  readonly line: number;
  readonly status: number;
  readonly template: string;

  constructor(path: string, status: number, payload?: BuildAdapterErrorBody) {
    super(getBuildAdapterAPIErrorMessage(path, status, payload));
    this.name = "BuildAdapterAPIError";
    this.line = payload?.line ?? 0;
    this.status = status;
    this.template = payload?.template ?? "";
  }
}

const buildAdapterAPIErrorMessages: Record<string, string> = {
  "build adapter not found": "构建适配器不存在",
  "build adapter service unavailable": "构建适配器服务暂不可用",
  "build adapter was modified concurrently": "适配器已被他人修改，请刷新",
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid build adapter request": "适配器参数无效，请检查表单",
  "module not found": "模块不存在",
};

const invalidInputPrefix = "invalid build adapter request: ";

function getBuildAdapterAPIErrorMessage(
  path: string,
  status: number,
  payload?: BuildAdapterErrorBody,
) {
  if (status === 409) {
    return "适配器已被他人修改，请刷新";
  }
  const error = payload?.error;
  if (!error) {
    return `Request ${path} failed with ${status}`;
  }
  // 后端参数校验的具体原因是中文，直接展示，去掉英文前缀。
  if (error.startsWith(invalidInputPrefix)) {
    return error.slice(invalidInputPrefix.length);
  }
  return buildAdapterAPIErrorMessages[error] ?? error;
}

/**
 * 构建适配器接口统一使用的请求函数。readErrorPayload 返回的是完整 JSON，
 * 只是类型上只声明了 error，这里按适配器错误体读取 template/line。
 */
export const fetchBuildAdapterJSON = createFetchClient(
  (path, status, payload) =>
    new BuildAdapterAPIError(path, status, payload as BuildAdapterErrorBody | undefined),
);

export async function fetchBuildAdapters(
  status: BuildAdapterStatus | "" = "",
): Promise<BuildAdapter[]> {
  const query = status ? `?${new URLSearchParams({ status }).toString()}` : "";
  const payload = await fetchBuildAdapterJSON<APISchemas["BuildAdaptersResponse"]>(
    `/api/v1/build-adapters${query}`,
  );
  return payload.buildAdapters;
}

export async function fetchBuildAdapter(adapterId: string): Promise<BuildAdapter> {
  const payload = await fetchBuildAdapterJSON<APISchemas["BuildAdapterDetailResponse"]>(
    `/api/v1/build-adapters/${encodeURIComponent(adapterId)}`,
  );
  return payload.buildAdapter;
}

/** 渲染已保存的适配器：模板或参数错误时仍返回 200，ok=false。 */
export function previewBuildAdapter(
  adapterId: string,
  input: BuildAdapterRenderPreviewRequest,
): Promise<BuildAdapterRenderPreview> {
  return fetchBuildAdapterJSON<BuildAdapterRenderPreview>(
    `/api/v1/build-adapters/${encodeURIComponent(adapterId)}/render-preview`,
    { body: JSON.stringify(input), method: "POST" },
  );
}
