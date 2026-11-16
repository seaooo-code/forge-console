import type { APISchemas } from "@/api/client";
import type { BuildAdapterParameter, BuildAdapterStatus } from "@/types/build-adapters";

export type {
  BuildAdapter,
  BuildAdapterParameter,
  BuildAdapterRenderError,
  BuildAdapterRenderPreview,
  BuildAdapterStatus,
} from "@/types/build-adapters";

export type BuildAdapterCreateRequest = APISchemas["BuildAdapterCreateRequest"];

export type BuildAdapterUpdateRequest = APISchemas["BuildAdapterUpdateRequest"];

export type BuildAdapterDraftPreviewRequest = APISchemas["BuildAdapterDraftRenderPreviewRequest"];

export type BuildAdapterStatusFilter = "" | BuildAdapterStatus;

/** 辅助文件在表单里用数组维护，提交时再转成 {path: content}。 */
export type BuildAdapterFileFormState = {
  content: string;
  path: string;
};

export type BuildAdapterFormState = {
  description: string;
  dockerfileTemplate: string;
  files: BuildAdapterFileFormState[];
  name: string;
  parameters: BuildAdapterParameter[];
};

/** 渲染预览面板的输入：可选模块与示例参数，不随适配器保存。 */
export type BuildAdapterPreviewFormState = {
  moduleId: string;
  params: Record<string, string>;
};

/** 标注在编辑器旁的模板错误：template 是 "Dockerfile" 或辅助文件路径，line 从 1 开始，0 表示未知。 */
export type BuildAdapterTemplateError = {
  line: number;
  message: string;
  source: "preview" | "save";
  template: string;
};
