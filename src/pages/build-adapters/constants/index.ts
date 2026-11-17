import type {
  BuildAdapterFormState,
  BuildAdapterParameter,
  BuildAdapterStatus,
  BuildAdapterStatusFilter,
} from "../types";

export const buildAdapterStatusLabels: Record<BuildAdapterStatus, string> = {
  active: "启用中",
  disabled: "已停用",
};

export const buildAdapterStatusBadgeVariant: Record<BuildAdapterStatus, "neutral" | "success"> = {
  active: "success",
  disabled: "neutral",
};

/** Radix Select 不接受空字符串作为选项值，"全部状态 / 示例上下文"用这个占位值映射到空字符串。 */
export const emptySelectValue = "__all__";

export const buildAdapterStatusFilterOptions: Array<{
  label: string;
  value: BuildAdapterStatusFilter;
}> = [
  { label: "全部", value: "" },
  { label: "启用中", value: "active" },
  { label: "已停用", value: "disabled" },
];

export const buildAdapterParameterKeyPattern = /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/;

/** 编辑过程中调用草稿预览的防抖时间。 */
export const buildAdapterPreviewDebounceMs = 600;

/** 后端渲染错误里 Dockerfile 模板的名称；辅助文件用其相对路径。 */
export const dockerfileTemplateName = "Dockerfile";

/** 辅助文件渲染后放到构建上下文的这个目录下。 */
export const buildAdapterFilesDir = ".forge";

// 与后端 domain 层的限制保持一致，前端提前提示，最终以后端校验为准。
export const maxBuildAdapterNameLength = 100;
export const maxBuildAdapterDescriptionLength = 2000;
export const maxBuildAdapterFiles = 20;
export const maxBuildAdapterFilePathLength = 255;
export const maxBuildAdapterParameters = 50;

export const emptyBuildAdapterParameter: BuildAdapterParameter = {
  default: "",
  description: "",
  key: "",
  label: "",
  required: false,
};

export const defaultBuildAdapterForm: BuildAdapterFormState = {
  description: "",
  dockerfileTemplate: "",
  files: [],
  name: "",
  parameters: [],
};

export const dockerfileTemplatePlaceholder = `# syntax=docker/dockerfile:1
FROM node:20 AS build
WORKDIR /workspace
COPY . .
RUN --mount=type=secret,id=NPM_TOKEN sh .forge/build.sh {{ .Params.entry | quote }}

FROM scratch
COPY --from=build /workspace/dist /dist`;

/** 模板上下文字段，内容对应后端 BuildAdapterRenderContext。 */
export const buildAdapterTemplateFields: Array<{ description: string; name: string }> = [
  { description: "模块 ID 和名称", name: ".Module.ID / .Module.Name" },
  { description: "构建环境 code", name: ".Environment" },
  { description: "本次构建的分支和完整 commit SHA", name: ".Branch / .CommitSHA" },
  { description: "构建记录 ID", name: ".Build.ID" },
  { description: "模块内构建号，从 1 递增", name: ".Build.Number" },
  { description: "构建开始时间，UTC RFC 3339", name: ".Build.Time" },
  { description: "模块填写的参数，未填写时取默认值", name: ".Params.<key>" },
];

/** 模板可用函数白名单，内容对应后端 buildAdapterTemplateFuncs 与允许的内置函数。 */
export const buildAdapterTemplateFunctions: Array<{ description: string; usage: string }> = [
  { description: "值为空时使用默认值", usage: '{{ .Params.x | default "fallback" }}' },
  {
    description: "输出 JSON 双引号字符串，适合 Dockerfile 的 JSON 数组写法",
    usage: "{{ quote .Params.x }}",
  },
  { description: "用分隔符拼接多个值", usage: '{{ join "," .Params.a .Params.b }}' },
  { description: "转小写、转大写、去掉首尾空白", usage: "{{ lower .Branch }} / upper / trim" },
  { description: "字符串替换", usage: '{{ .Branch | replace "/" "-" }}' },
  { description: "逻辑与比较，可用于 if 条件", usage: "and or not eq ne lt le gt ge" },
];
