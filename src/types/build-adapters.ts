import type { APISchemas } from "@/api/client";

export type BuildAdapter = APISchemas["BuildAdapter"];

export type BuildAdapterStatus = BuildAdapter["status"];

export type BuildAdapterParameter = APISchemas["BuildAdapterParameter"];

export type BuildAdapterRenderPreview = APISchemas["BuildAdapterRenderPreviewResponse"];

export type BuildAdapterRenderError = APISchemas["BuildAdapterRenderError"];

export type BuildAdapterRenderPreviewRequest = APISchemas["BuildAdapterRenderPreviewRequest"];

export type BuildMode = NonNullable<APISchemas["ModuleBuildConfig"]["buildMode"]>;
