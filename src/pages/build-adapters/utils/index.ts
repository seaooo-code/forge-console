import { format, isValid, parseISO } from "date-fns";

import { BuildAdapterAPIError } from "@/api/build-adapters";
import { hasControlCharacter } from "@/utils";

import {
  buildAdapterParameterKeyPattern,
  defaultBuildAdapterForm,
  dockerfileTemplateName,
  maxBuildAdapterFilePathLength,
} from "../constants";
import type {
  BuildAdapter,
  BuildAdapterCreateRequest,
  BuildAdapterDraftPreviewRequest,
  BuildAdapterFileFormState,
  BuildAdapterFormState,
  BuildAdapterParameter,
  BuildAdapterPreviewFormState,
  BuildAdapterTemplateError,
  BuildAdapterUpdateRequest,
} from "../types";

export function buildAdapterToForm(adapter?: BuildAdapter): BuildAdapterFormState {
  if (!adapter) {
    return { ...defaultBuildAdapterForm, files: [], parameters: [] };
  }

  return {
    description: adapter.description,
    dockerfileTemplate: adapter.dockerfileTemplate,
    files: Object.keys(adapter.files)
      .sort()
      .map((path) => ({ content: adapter.files[path], path })),
    name: adapter.name,
    parameters: adapter.parameters.map((parameter) => ({ ...parameter })),
  };
}

export function filesToRecord(files: BuildAdapterFileFormState[]): Record<string, string> {
  return Object.fromEntries(files.map((file) => [file.path.trim(), file.content]));
}

export function normalizeParameters(parameters: BuildAdapterParameter[]): BuildAdapterParameter[] {
  return parameters.map((parameter) => ({
    default: parameter.default.trim(),
    description: parameter.description.trim(),
    key: parameter.key.trim(),
    label: parameter.label.trim(),
    required: parameter.required,
  }));
}

export function buildCreatePayload(form: BuildAdapterFormState): BuildAdapterCreateRequest {
  return {
    description: form.description.trim(),
    dockerfileTemplate: form.dockerfileTemplate,
    files: filesToRecord(form.files),
    name: form.name.trim(),
    parameters: normalizeParameters(form.parameters),
  };
}

/** 只提交和已保存版本不同的字段；files、parameters 一旦提交就整体替换。 */
export function buildUpdatePayload(
  form: BuildAdapterFormState,
  adapter: BuildAdapter,
): BuildAdapterUpdateRequest {
  const payload: BuildAdapterUpdateRequest = {};
  const name = form.name.trim();
  const description = form.description.trim();
  const files = filesToRecord(form.files);
  const parameters = normalizeParameters(form.parameters);

  if (name !== adapter.name) {
    payload.name = name;
  }
  if (description !== adapter.description) {
    payload.description = description;
  }
  if (form.dockerfileTemplate !== adapter.dockerfileTemplate) {
    payload.dockerfileTemplate = form.dockerfileTemplate;
  }
  if (stableStringify(files) !== stableStringify(adapter.files)) {
    payload.files = files;
  }
  if (JSON.stringify(parameters) !== JSON.stringify(adapter.parameters)) {
    payload.parameters = parameters;
  }
  return payload;
}

/**
 * 草稿预览请求：跳过路径或 key 还没填的行，避免编辑中途的空行刷出无意义的错误；
 * 只有填写了示例参数时才带 params，否则选了模块时后端使用模块已保存的参数。
 */
export function buildDraftPreviewPayload(
  form: BuildAdapterFormState,
  preview: BuildAdapterPreviewFormState,
): BuildAdapterDraftPreviewRequest {
  const parameters = normalizeParameters(form.parameters).filter((parameter) => parameter.key);
  const params = Object.fromEntries(
    parameters
      .map((parameter) => [parameter.key, preview.params?.[parameter.key]?.trim() ?? ""] as const)
      .filter(([, value]) => value !== ""),
  );

  return {
    dockerfileTemplate: form.dockerfileTemplate,
    files: filesToRecord(form.files.filter((file) => file.path.trim() !== "")),
    moduleId: preview.moduleId || undefined,
    parameters,
    params: Object.keys(params).length > 0 ? params : undefined,
  };
}

/** 与后端 IsValidBuildAdapterFilePath 一致：规范化的相对路径，不含 ..、反斜杠或控制字符。 */
export function validateBuildAdapterFilePath(value: string): string | true {
  const path = value.trim();
  if (!path) {
    return "请填写文件路径";
  }
  if (path.length > maxBuildAdapterFilePathLength) {
    return `路径不能超过 ${maxBuildAdapterFilePathLength} 个字符`;
  }
  if (path.startsWith("/") || path.includes("\\") || hasControlCharacter(path)) {
    return "路径必须是相对路径，不能以 / 开头或包含反斜杠";
  }
  const segments = path.split("/");
  if (segments.includes("..")) {
    return "路径不能包含 ..";
  }
  if (segments.some((segment) => segment === "" || segment === ".")) {
    return "路径不能包含空目录、. 或以 / 结尾";
  }
  return true;
}

export function validateBuildAdapterParameterKey(value: string): string | true {
  const key = value.trim();
  if (!key) {
    return "请填写 key";
  }
  return buildAdapterParameterKeyPattern.test(key)
    ? true
    : "key 需以字母开头，只能包含字母、数字和下划线，最长 64 位";
}

/** 从保存失败的错误中取出模板与行号，用于在编辑器旁标注。 */
export function getSaveTemplateError(error: unknown): BuildAdapterTemplateError | null {
  if (!(error instanceof BuildAdapterAPIError) || error.status !== 400 || !error.template) {
    return null;
  }
  // 后端 error 字段形如 "Dockerfile 第 3 行：xxx"，模板与行号已单独展示，这里去掉前缀。
  const prefix = error.line > 0 ? `${error.template} 第 ${error.line} 行：` : `${error.template}：`;
  return {
    line: error.line,
    message: error.message.startsWith(prefix) ? error.message.slice(prefix.length) : error.message,
    source: "save",
    template: error.template,
  };
}

export function isDockerfileTemplate(template: string) {
  return template === dockerfileTemplateName;
}

export function formatTemplateLocation(
  error: Pick<BuildAdapterTemplateError, "line" | "template">,
) {
  const template = error.template || "参数";
  return error.line > 0 ? `${template} 第 ${error.line} 行` : template;
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "-";
  }
  const date = parseISO(value);
  return isValid(date) ? format(date, "yyyy-MM-dd HH:mm") : value;
}

function stableStringify(record: Record<string, string>) {
  return JSON.stringify(
    Object.keys(record)
      .sort()
      .map((key) => [key, record[key]]),
  );
}
