import { useMutation } from "@tanstack/react-query";
import { Blocks, Eye, FileCode2, Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import {
  type Control,
  Controller,
  type UseFormRegister,
  type UseFormRegisterReturn,
  useFieldArray,
  useFormState,
  useWatch,
} from "react-hook-form";
import { BuildAdapterAPIError, previewBuildAdapter } from "@/api/build-adapters";
import { BuildAdapterRenderResult } from "@/components/common/BuildAdapterRenderResult";
import { Modal, ModalFooter, ModalHeader } from "@/components/common/Modal";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasControlCharacter } from "@/utils";

import {
  buildModeLabels,
  emptySelectValue,
  maxAutoBuildBranches,
  maxAutoPreviewTtlHours,
} from "../constants";
import type { BuildAdapter, BuildMode, ModuleFormState } from "../types";
import { pickAdapterParams } from "../utils";

type ModuleBuildConfigFieldsProps = {
  /** 构建适配器列表查询结果；无读取权限时 adaptersError 为 403。 */
  adapters: BuildAdapter[] | undefined;
  adaptersError: unknown;
  clearFormError: () => void;
  control: Control<ModuleFormState>;
  /** 模块已保存的适配器 id：已停用的适配器只在模块正在使用时出现在下拉框里。 */
  currentAdapterId: string;
  currentAdapterName: string;
  environmentOptions: Array<{ label: string; value: string }>;
  isAdaptersLoading: boolean;
  /** 编辑已有模块时传入，预览按该模块的上下文渲染；新建时用示例上下文。 */
  moduleId?: string;
  register: UseFormRegister<ModuleFormState>;
};

export function ModuleBuildConfigFields({
  adapters,
  adaptersError,
  clearFormError,
  control,
  currentAdapterId,
  currentAdapterName,
  environmentOptions,
  isAdaptersLoading,
  moduleId,
  register,
}: ModuleBuildConfigFieldsProps) {
  const { append, fields, remove } = useFieldArray({
    control,
    name: "buildConfig.autoBuildBranches",
  });
  const autoPreviewRelease = useWatch({ control, name: "buildConfig.autoPreviewRelease" });
  const buildMode = useWatch({ control, name: "buildConfig.buildMode" });
  const withClear = <Name extends string>(
    field: UseFormRegisterReturn<Name>,
  ): UseFormRegisterReturn<Name> => ({
    ...field,
    onChange: (event) => {
      clearFormError();
      return field.onChange(event);
    },
  });

  return (
    <section className="border-border border-t pt-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-4 w-1 rounded-full bg-info" />
        <h2 className="font-semibold text-foreground text-sm">构建配置</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
        <Field label="构建方式" className="md:col-span-2 xl:col-span-12">
          <Controller
            control={control}
            name="buildConfig.buildMode"
            render={({ field }) => (
              <Tabs
                value={field.value}
                onValueChange={(value) => {
                  clearFormError();
                  field.onChange(value as BuildMode);
                }}
              >
                <TabsList>
                  <TabsTrigger value="dockerfile">
                    <FileCode2 />
                    {buildModeLabels.dockerfile}
                  </TabsTrigger>
                  <TabsTrigger value="adapter">
                    <Blocks />
                    {buildModeLabels.adapter}
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="dockerfile"
                  className="rounded-md border border-border bg-muted/40 px-3 py-3"
                >
                  <div className="grid gap-4 xl:grid-cols-12">
                    <Field
                      label="Dockerfile 路径"
                      hint="相对仓库根目录；同一仓库可用不同 Dockerfile 绑定多个模块"
                      className="xl:col-span-4"
                    >
                      <Input
                        placeholder="Dockerfile"
                        {...withClear(register("buildConfig.dockerfilePath"))}
                      />
                    </Field>
                  </div>
                </TabsContent>
                <TabsContent
                  value="adapter"
                  className="rounded-md border border-border bg-muted/40 px-3 py-3"
                >
                  <AdapterFields
                    adapters={adapters}
                    adaptersError={adaptersError}
                    clearFormError={clearFormError}
                    control={control}
                    currentAdapterId={currentAdapterId}
                    currentAdapterName={currentAdapterName}
                    isAdaptersLoading={isAdaptersLoading}
                    moduleId={moduleId}
                    register={register}
                  />
                </TabsContent>
              </Tabs>
            )}
          />
        </Field>

        <Field
          label="构建上下文"
          hint={
            buildMode === "adapter"
              ? "相对仓库根目录，默认 .；适配器的辅助文件会放到其下的 .forge/"
              : "相对仓库根目录，默认 ."
          }
          className="xl:col-span-4"
        >
          <Input placeholder="." {...withClear(register("buildConfig.buildContext"))} />
        </Field>
        <Field label="自动构建环境" hint="填写自动构建分支时必选" className="xl:col-span-4">
          <Controller
            control={control}
            name="buildConfig.autoBuildEnvironment"
            render={({ field }) => (
              <Select
                value={field.value || emptySelectValue}
                onValueChange={(value) => {
                  clearFormError();
                  field.onChange(value === emptySelectValue ? "" : value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="选择环境" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={emptySelectValue}>不自动构建</SelectItem>
                  {environmentOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>

        <Field
          label="自动构建分支"
          hint={`push 到匹配分支时自动构建，支持 glob（如 main、release/*），最多 ${maxAutoBuildBranches} 条；留空表示不自动构建`}
          className="md:col-span-2 xl:col-span-8"
        >
          <div className="space-y-2">
            {fields.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <Input
                  className="font-mono"
                  placeholder="例如：release/*"
                  {...withClear(register(`buildConfig.autoBuildBranches.${index}.value`))}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="删除分支规则"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    clearFormError();
                    remove(index);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={fields.length >= maxAutoBuildBranches}
              onClick={() => {
                clearFormError();
                append({ value: "" });
              }}
            >
              <Plus className="size-3.5" />
              添加分支规则
            </Button>
          </div>
        </Field>

        <Field label="预览通道" className="md:col-span-2 xl:col-span-4">
          <div className="space-y-3 rounded-md border border-border bg-muted/40 px-3 py-3">
            <Controller
              control={control}
              name="buildConfig.autoPreviewRelease"
              render={({ field }) => (
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="module-auto-preview-release"
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      clearFormError();
                      field.onChange(checked === true);
                    }}
                  />
                  <label
                    htmlFor="module-auto-preview-release"
                    className="cursor-pointer text-foreground text-sm leading-5"
                  >
                    自动构建成功后，按分支名创建定向发布
                  </label>
                </div>
              )}
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={maxAutoPreviewTtlHours}
                step={1}
                disabled={!autoPreviewRelease}
                className="w-28"
                {...withClear(register("buildConfig.autoPreviewTtlHours", { valueAsNumber: true }))}
              />
              <span className="text-muted-foreground text-xs">
                小时后过期（1 - {maxAutoPreviewTtlHours}）
              </span>
            </div>
          </div>
        </Field>
      </div>
    </section>
  );
}

function AdapterFields({
  adapters,
  adaptersError,
  clearFormError,
  control,
  currentAdapterId,
  currentAdapterName,
  isAdaptersLoading,
  moduleId,
  register,
}: Omit<ModuleBuildConfigFieldsProps, "environmentOptions">) {
  const buildAdapterId = useWatch({ control, name: "buildConfig.buildAdapterId" });
  const paramValues = useWatch({ control, name: "buildConfig.buildAdapterParams" });
  const { errors } = useFormState({ control, name: "buildConfig.buildAdapterParams" });
  const previewMutation = useMutation({
    mutationFn: (adapter: BuildAdapter) =>
      previewBuildAdapter(adapter.id, {
        moduleId: moduleId || undefined,
        params: pickAdapterParams(paramValues, adapter),
      }),
  });
  // 启用中的适配器都可选；已停用的只在模块原本就使用它时出现，便于继续保存。
  const options = (adapters ?? []).filter(
    (adapter) => adapter.status === "active" || adapter.id === currentAdapterId,
  );
  const selectedAdapter = options.find((adapter) => adapter.id === buildAdapterId);
  const isForbidden = adaptersError instanceof BuildAdapterAPIError && adaptersError.status === 403;

  if (adaptersError) {
    return (
      <Alert variant="warning">
        {isForbidden
          ? "当前账号无权读取构建适配器，选用适配器需要平台管理员，或该应用的 Owner。"
          : adaptersError instanceof Error
            ? `构建适配器读取失败：${adaptersError.message}`
            : "构建适配器读取失败，请稍后重试"}
        {currentAdapterId ? (
          <div className="mt-1">
            当前使用：{currentAdapterName || currentAdapterId}，保存时保持不变。
          </div>
        ) : null}
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-12">
        <Field
          label="构建适配器"
          hint={selectedAdapter?.description || "选择平台维护的构建配方，仓库无需提供 Dockerfile"}
          className="xl:col-span-6"
        >
          <Controller
            control={control}
            name="buildConfig.buildAdapterId"
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                disabled={isAdaptersLoading}
                onValueChange={(value) => {
                  clearFormError();
                  field.onChange(value);
                }}
              >
                <SelectTrigger className="w-full bg-card">
                  <SelectValue
                    placeholder={
                      isAdaptersLoading
                        ? "加载适配器中"
                        : options.length === 0
                          ? "暂无启用中的适配器"
                          : "选择构建适配器"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {options.map((adapter) => (
                    <SelectItem key={adapter.id} value={adapter.id}>
                      <span className="flex items-center gap-2">
                        {adapter.name}
                        <span className="font-mono text-muted-foreground text-xs">
                          v{adapter.version}
                        </span>
                        {adapter.status === "disabled" ? (
                          <Badge variant="neutral" size="sm">
                            已停用
                          </Badge>
                        ) : null}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        {selectedAdapter ? (
          <div className="flex items-start xl:col-span-6 xl:pt-6">
            <Button
              type="button"
              variant="outline"
              className="bg-card"
              disabled={previewMutation.isPending}
              loading={previewMutation.isPending}
              onClick={() => previewMutation.mutate(selectedAdapter)}
            >
              <Eye className="size-4" />
              预览渲染结果
            </Button>
          </div>
        ) : null}
      </div>

      {selectedAdapter?.status === "disabled" ? (
        <Alert variant="warning">
          该适配器已停用：模块可以继续保存，但无法发起新构建。启用适配器或换用其他适配器后才能构建。
        </Alert>
      ) : null}

      {selectedAdapter ? (
        selectedAdapter.parameters.length === 0 ? (
          <p className="text-muted-foreground text-xs">该适配器没有参数。</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {selectedAdapter.parameters.map((parameter) => {
              const error = errors.buildConfig?.buildAdapterParams?.[parameter.key]?.message;
              return (
                <Field
                  key={parameter.key}
                  label={parameter.label || parameter.key}
                  required={parameter.required && !parameter.default}
                  hint={parameter.description || undefined}
                  error={error}
                >
                  <Input
                    {...register(`buildConfig.buildAdapterParams.${parameter.key}`, {
                      onChange: clearFormError,
                      validate: (value: string | undefined) => {
                        const text = value ?? "";
                        if (hasControlCharacter(text)) {
                          return "参数值不能包含换行或控制字符";
                        }
                        if (parameter.required && !parameter.default && !text.trim()) {
                          return `请填写${parameter.label || parameter.key}`;
                        }
                        return true;
                      },
                    })}
                    className="bg-card font-mono"
                    placeholder={parameter.default ? `默认：${parameter.default}` : "未填写"}
                    aria-invalid={error ? true : undefined}
                  />
                </Field>
              );
            })}
          </div>
        )
      ) : null}

      <p className="text-muted-foreground text-xs">
        参数不能存放密钥，密钥请使用模块的构建变量，在适配器的 Dockerfile 里通过 --mount=type=secret
        读取。
      </p>

      <Modal
        isOpen={previewMutation.isSuccess || previewMutation.isError}
        onClose={() => previewMutation.reset()}
        labelledBy="module-adapter-preview-title"
        className="max-h-[90vh] max-w-4xl overflow-y-auto"
      >
        <ModalHeader
          title={`渲染预览 · ${selectedAdapter?.name ?? ""}`}
          titleId="module-adapter-preview-title"
          description={
            moduleId
              ? "使用当前模块的上下文与表单里的参数渲染，未填写的参数取默认值；不会执行构建。"
              : "模块尚未创建，使用示例上下文与表单里的参数渲染；不会执行构建。"
          }
        >
          {previewMutation.data ? <BuildAdapterRenderResult result={previewMutation.data} /> : null}
          {previewMutation.error ? (
            <Alert variant="danger">
              {previewMutation.error instanceof Error ? previewMutation.error.message : "预览失败"}
            </Alert>
          ) : null}
        </ModalHeader>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={() => previewMutation.reset()}>
            关闭
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

function Field({
  children,
  className,
  error,
  hint,
  label,
  required = false,
}: {
  children: ReactNode;
  className?: string;
  error?: string;
  hint?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className={className}>
      <div className="mb-2 font-medium text-muted-foreground text-xs">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </div>
      {children}
      {error ? (
        <p className="mt-1.5 text-destructive text-xs">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  );
}
