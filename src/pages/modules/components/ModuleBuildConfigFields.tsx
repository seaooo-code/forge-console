import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import {
  type Control,
  Controller,
  type UseFormRegister,
  type UseFormRegisterReturn,
  useFieldArray,
  useWatch,
} from "react-hook-form";
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

import { emptySelectValue, maxAutoBuildBranches, maxAutoPreviewTtlHours } from "../constants";
import type { ModuleFormState } from "../types";

export function ModuleBuildConfigFields({
  clearFormError,
  control,
  environmentOptions,
  register,
}: {
  clearFormError: () => void;
  control: Control<ModuleFormState>;
  environmentOptions: Array<{ label: string; value: string }>;
  register: UseFormRegister<ModuleFormState>;
}) {
  const { append, fields, remove } = useFieldArray({
    control,
    name: "buildConfig.autoBuildBranches",
  });
  const autoPreviewRelease = useWatch({ control, name: "buildConfig.autoPreviewRelease" });
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
        <Field
          label="Dockerfile 路径"
          hint="相对仓库根目录；同一仓库可用不同 Dockerfile 绑定多个模块"
          className="xl:col-span-4"
        >
          <Input placeholder="Dockerfile" {...withClear(register("buildConfig.dockerfilePath"))} />
        </Field>
        <Field label="构建上下文" hint="相对仓库根目录，默认 ." className="xl:col-span-4">
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

function Field({
  children,
  className,
  hint,
  label,
}: {
  children: ReactNode;
  className?: string;
  hint?: string;
  label: string;
}) {
  return (
    <div className={className}>
      <div className="mb-2 font-medium text-muted-foreground text-xs">{label}</div>
      {children}
      {hint ? <p className="mt-1.5 text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}
