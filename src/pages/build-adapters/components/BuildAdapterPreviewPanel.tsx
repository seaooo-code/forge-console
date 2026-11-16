import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Eye, LoaderCircle } from "lucide-react";
import { useEffect, useMemo } from "react";
import { type Control, Controller, useForm, useWatch } from "react-hook-form";

import { fetchAllModulesSnapshot, modulesAllQueryKey } from "@/api/modules";
import { BuildAdapterRenderResult } from "@/components/common/BuildAdapterRenderResult";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import {
  buildAdapterDraftPreviewQueryKey,
  previewBuildAdapterDraft,
} from "../api/build-adapters-snapshot";
import {
  buildAdapterParameterKeyPattern,
  buildAdapterPreviewDebounceMs,
  emptySelectValue,
} from "../constants";
import type {
  BuildAdapterFormState,
  BuildAdapterPreviewFormState,
  BuildAdapterTemplateError,
} from "../types";
import { buildDraftPreviewPayload } from "../utils";

type BuildAdapterPreviewPanelProps = {
  control: Control<BuildAdapterFormState>;
  onTemplateErrorChange: (error: BuildAdapterTemplateError | null) => void;
};

const allModulesFilters = {};

/** 编辑过程中防抖调用草稿预览接口，展示渲染结果或带行号的错误。仅管理员可见。 */
export function BuildAdapterPreviewPanel({
  control,
  onTemplateErrorChange,
}: BuildAdapterPreviewPanelProps) {
  const previewForm = useForm<BuildAdapterPreviewFormState>({
    defaultValues: { moduleId: "", params: {} },
  });
  const draft = useWatch({ control }) as BuildAdapterFormState;
  const preview = useWatch({ control: previewForm.control }) as BuildAdapterPreviewFormState;
  const { data: modulesSnapshot, isFetching: isModulesFetching } = useQuery({
    queryFn: () => fetchAllModulesSnapshot(allModulesFilters),
    queryKey: modulesAllQueryKey(allModulesFilters),
  });
  const parameters = useMemo(
    () =>
      (draft.parameters ?? []).filter((parameter) =>
        buildAdapterParameterKeyPattern.test(parameter.key?.trim() ?? ""),
      ),
    [draft.parameters],
  );
  const payload = JSON.stringify(
    buildDraftPreviewPayload(
      {
        description: "",
        dockerfileTemplate: draft.dockerfileTemplate ?? "",
        files: draft.files ?? [],
        name: "",
        parameters: draft.parameters ?? [],
      },
      { moduleId: preview.moduleId ?? "", params: preview.params ?? {} },
    ),
  );
  const debouncedPayload = useDebouncedValue(payload, buildAdapterPreviewDebounceMs);
  const hasTemplate = (draft.dockerfileTemplate ?? "").trim() !== "";
  const previewQuery = useQuery({
    enabled: hasTemplate,
    gcTime: 30_000,
    placeholderData: keepPreviousData,
    queryFn: () => previewBuildAdapterDraft(JSON.parse(debouncedPayload)),
    queryKey: buildAdapterDraftPreviewQueryKey(debouncedPayload),
    retry: false,
  });
  const result = hasTemplate ? previewQuery.data : undefined;
  const renderError = result && !result.ok ? result.error : null;

  useEffect(() => {
    onTemplateErrorChange(
      renderError?.template
        ? {
            line: renderError.line,
            message: renderError.message,
            source: "preview",
            template: renderError.template,
          }
        : null,
    );
  }, [onTemplateErrorChange, renderError]);

  const isPending = payload !== debouncedPayload || previewQuery.isFetching;

  return (
    <Card className="gap-0 rounded-lg border-border p-0 shadow-none">
      <div className="flex items-center justify-between gap-2 border-border border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground text-sm">渲染预览</h2>
        </div>
        {hasTemplate && isPending ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
            <LoaderCircle className="size-3.5 animate-spin" />
            预览中
          </span>
        ) : null}
      </div>

      <div className="space-y-4 px-4 py-3">
        <div className="space-y-1.5">
          <div className="font-medium text-muted-foreground text-xs">渲染上下文</div>
          <Controller
            control={previewForm.control}
            name="moduleId"
            render={({ field }) => (
              <Select
                value={field.value || emptySelectValue}
                onValueChange={(value) => field.onChange(value === emptySelectValue ? "" : value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isModulesFetching ? "加载模块中" : "选择模块"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={emptySelectValue}>示例上下文（不选模块）</SelectItem>
                  {(modulesSnapshot?.modules ?? []).map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      {module.name}（{module.id}）
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <p className="text-muted-foreground text-xs leading-5">
            {preview.moduleId
              ? "使用模块的 ID、名称、自动构建环境和默认分支渲染。"
              : "示例上下文：模块 sample-module、环境 test、分支 main、构建号 1。"}
          </p>
        </div>

        {parameters.length > 0 ? (
          <div className="space-y-2">
            <div className="font-medium text-muted-foreground text-xs">示例参数</div>
            {parameters.map((parameter) => (
              <div key={parameter.key} className="grid grid-cols-5 items-center gap-2">
                <span
                  className="col-span-2 truncate font-mono text-foreground text-xs"
                  title={parameter.label || parameter.key}
                >
                  {parameter.key}
                  {parameter.required ? <span className="ml-0.5 text-destructive">*</span> : null}
                </span>
                <Input
                  {...previewForm.register(`params.${parameter.key}`)}
                  placeholder={parameter.default || "留空取默认值"}
                  className="col-span-3 h-8 font-mono text-xs md:text-xs"
                />
              </div>
            ))}
            <p className="text-muted-foreground text-xs leading-5">
              填写任一参数后按填写值渲染，留空的取默认值；都不填且选了模块时，使用模块已保存的参数。
            </p>
          </div>
        ) : null}

        {!hasTemplate ? (
          <p className="rounded-md border border-border border-dashed px-3 py-4 text-center text-muted-foreground text-xs">
            填写 Dockerfile 模板后自动预览
          </p>
        ) : previewQuery.isError ? (
          <Alert variant="danger">
            {previewQuery.error instanceof Error ? previewQuery.error.message : "预览失败"}
          </Alert>
        ) : result ? (
          <BuildAdapterRenderResult result={result} />
        ) : (
          <div className="h-32 animate-pulse rounded-md bg-muted" />
        )}
      </div>
    </Card>
  );
}
