import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";

export type ReleaseChannel = APISchemas["ReleaseChannel"];
export type ReleaseChannelCreateInput = APISchemas["ReleaseChannelCreateRequest"];
export type ReleaseChannelUpdateInput = APISchemas["ReleaseChannelUpdateRequest"];

export const releaseChannelsRootQueryKey = ["release-channels"] as const;
export const releaseChannelsQueryKey = (applicationSlug: string) =>
  [...releaseChannelsRootQueryKey, applicationSlug] as const;

const releaseChannelAPIErrorMessages: Record<string, string> = {
  "application not found": "应用不存在",
  forbidden: "当前账号无权限管理该应用的发布渠道",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid release channel request": "渠道参数无效，请检查标识、名称和说明",
  "release channel already exists": "该应用下已有同一标识的渠道",
  "release channel in use": "渠道在某个环境下还有生效中的发布，先停用这些发布再删除",
  "release channel not found": "渠道不存在，可能已被删除",
};

export class ReleaseChannelAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    const error = payload?.error;
    super(
      (error && releaseChannelAPIErrorMessages[error]) ||
        error ||
        `Request ${path} failed with ${status}`,
    );
    this.name = "ReleaseChannelAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new ReleaseChannelAPIError(path, status, payload),
  { allowEmpty: true },
);

const channelsPath = (applicationSlug: string) =>
  `/api/v1/applications/${encodeURIComponent(applicationSlug)}/channels`;

export async function fetchReleaseChannels(applicationSlug: string): Promise<ReleaseChannel[]> {
  const payload = await fetchJSON<APISchemas["ReleaseChannelsResponse"]>(
    channelsPath(applicationSlug),
  );
  return payload.channels;
}

export function createReleaseChannel(applicationSlug: string, input: ReleaseChannelCreateInput) {
  return fetchJSON<ReleaseChannel>(channelsPath(applicationSlug), {
    body: JSON.stringify(input),
    method: "POST",
  });
}

export function updateReleaseChannel(
  applicationSlug: string,
  code: string,
  input: ReleaseChannelUpdateInput,
) {
  return fetchJSON<ReleaseChannel>(`${channelsPath(applicationSlug)}/${encodeURIComponent(code)}`, {
    body: JSON.stringify(input),
    method: "PATCH",
  });
}

export async function deleteReleaseChannel(applicationSlug: string, code: string) {
  await fetchJSON<void>(`${channelsPath(applicationSlug)}/${encodeURIComponent(code)}`, {
    method: "DELETE",
  });
}
