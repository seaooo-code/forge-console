import {
  BuildAdapterAPIError,
  buildAdapterDetailQueryKey,
  buildAdaptersQueryKey,
  buildAdaptersRootQueryKey,
  fetchBuildAdapter,
  fetchBuildAdapterJSON,
  fetchBuildAdapters,
} from "@/api/build-adapters";
import type { APISchemas } from "@/api/client";

import type {
  BuildAdapter,
  BuildAdapterCreateRequest,
  BuildAdapterDraftPreviewRequest,
  BuildAdapterRenderPreview,
  BuildAdapterUpdateRequest,
} from "../types";

export {
  BuildAdapterAPIError,
  buildAdapterDetailQueryKey,
  buildAdaptersQueryKey,
  buildAdaptersRootQueryKey,
  fetchBuildAdapter,
  fetchBuildAdapters,
};

export const buildAdapterDraftPreviewQueryKey = (payload: string) =>
  [...buildAdaptersRootQueryKey, "draft-preview", payload] as const;

type BuildAdapterDetailResponse = APISchemas["BuildAdapterDetailResponse"];

export async function createBuildAdapter(input: BuildAdapterCreateRequest): Promise<BuildAdapter> {
  const payload = await fetchBuildAdapterJSON<BuildAdapterDetailResponse>(
    "/api/v1/build-adapters",
    {
      body: JSON.stringify(input),
      method: "POST",
    },
  );
  return payload.buildAdapter;
}

export async function updateBuildAdapter(
  adapterId: string,
  input: BuildAdapterUpdateRequest,
): Promise<BuildAdapter> {
  const payload = await fetchBuildAdapterJSON<BuildAdapterDetailResponse>(
    `/api/v1/build-adapters/${encodeURIComponent(adapterId)}`,
    { body: JSON.stringify(input), method: "PATCH" },
  );
  return payload.buildAdapter;
}

export async function setBuildAdapterStatus(
  adapterId: string,
  action: "disable" | "enable",
): Promise<BuildAdapter> {
  const payload = await fetchBuildAdapterJSON<BuildAdapterDetailResponse>(
    `/api/v1/build-adapters/${encodeURIComponent(adapterId)}/${action}`,
    { method: "POST" },
  );
  return payload.buildAdapter;
}

/** 预览未保存的草稿，需要管理权限；草稿不合法时返回 200 且 ok=false。 */
export function previewBuildAdapterDraft(
  input: BuildAdapterDraftPreviewRequest,
): Promise<BuildAdapterRenderPreview> {
  return fetchBuildAdapterJSON<BuildAdapterRenderPreview>("/api/v1/build-adapters/render-preview", {
    body: JSON.stringify(input),
    method: "POST",
  });
}
