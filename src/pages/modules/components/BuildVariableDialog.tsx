import { type ReactNode, useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Modal, ModalFooter, ModalHeader } from "@/components/common/Modal";
import { Alert } from "@/components/ui/alert";
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

import {
  buildVariableKeyPattern,
  defaultBuildVariableForm,
  emptySelectValue,
  reservedBuildVariablePrefix,
} from "../constants";
import type { BuildVariableFormState, ModuleBuildVariable } from "../types";

/**
 * 新增 / 编辑构建变量。key + 环境是变量的唯一标识，编辑时两者只读。
 * 后端不支持"密钥留空不修改"（isSecret 且 value 为空会返回 400），
 * 所以编辑密钥且留空时由前端直接跳过请求，见 onSubmit 的 null 约定。
 */
export function BuildVariableDialog({
  environmentOptions,
  existingVariables,
  isOpen,
  onClose,
  onSubmit,
  submitError,
  variable,
}: {
  environmentOptions: Array<{ label: string; value: string }>;
  existingVariables: ModuleBuildVariable[];
  isOpen: boolean;
  onClose: () => void;
  /** form 为 null 表示编辑密钥时未填写新值，无需请求后端。 */
  onSubmit: (form: BuildVariableFormState | null) => Promise<void>;
  submitError: string;
  variable: ModuleBuildVariable | null;
}) {
  const isEditMode = variable !== null;
  const isEditingSecret = variable?.isSecret ?? false;
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<BuildVariableFormState>({ defaultValues: defaultBuildVariableForm });
  const isSecret = useWatch({ control, name: "isSecret" });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset(
      variable
        ? {
            environmentCode: variable.environmentCode,
            isSecret: variable.isSecret,
            key: variable.key,
            value: variable.isSecret ? "" : variable.value,
          }
        : defaultBuildVariableForm,
    );
  }, [isOpen, reset, variable]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={isSubmitting ? undefined : onClose}
      labelledBy="build-variable-dialog-title"
      describedBy="build-variable-dialog-description"
      className="max-w-lg"
    >
      <form
        onSubmit={handleSubmit(async (form) => {
          const keepSecret = isEditingSecret && form.isSecret && form.value === "";
          await onSubmit(keepSecret ? null : { ...form, key: form.key.trim() });
        })}
      >
        <ModalHeader
          title={isEditMode ? "编辑构建变量" : "新增构建变量"}
          titleId="build-variable-dialog-title"
          descriptionId="build-variable-dialog-description"
          description="普通变量通过 --build-arg 传入，密钥变量通过 BuildKit --secret 传入且只写不读。同名变量的环境专属值优先于全部环境。"
        />

        <div className="mt-4 space-y-4">
          <Field label="Key" error={errors.key?.message}>
            <Input
              readOnly={isEditMode}
              aria-invalid={Boolean(errors.key)}
              className={isEditMode ? "cursor-not-allowed bg-muted font-mono" : "font-mono"}
              placeholder="例如：API_BASE_URL"
              {...register("key", {
                validate: (value, form) => {
                  const key = value.trim();
                  if (!buildVariableKeyPattern.test(key)) {
                    return "需以大写字母开头，只包含大写字母、数字和下划线，最长 64 位";
                  }
                  if (key.startsWith(reservedBuildVariablePrefix)) {
                    return `${reservedBuildVariablePrefix} 前缀由平台保留`;
                  }
                  if (
                    !isEditMode &&
                    existingVariables.some(
                      (item) => item.key === key && item.environmentCode === form.environmentCode,
                    )
                  ) {
                    return "该作用环境下已存在同名变量，请直接编辑";
                  }
                  return true;
                },
              })}
            />
          </Field>

          <Field label="作用环境">
            <Controller
              control={control}
              name="environmentCode"
              render={({ field }) => (
                <Select
                  disabled={isEditMode}
                  value={field.value || emptySelectValue}
                  onValueChange={(value) => field.onChange(value === emptySelectValue ? "" : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={emptySelectValue}>全部环境</SelectItem>
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

          <Controller
            control={control}
            name="isSecret"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="build-variable-is-secret"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                <label
                  htmlFor="build-variable-is-secret"
                  className="cursor-pointer text-foreground text-sm"
                >
                  作为密钥保存（保存后不再显示原值）
                </label>
              </div>
            )}
          />

          <Field
            label="值"
            error={errors.value?.message}
            hint={isEditingSecret && isSecret ? "留空表示不修改原密钥" : undefined}
          >
            <Input
              type={isSecret ? "password" : "text"}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.value)}
              className="font-mono"
              placeholder={isEditingSecret && isSecret ? "留空表示不修改" : "变量值"}
              {...register("value", {
                validate: (value, form) => {
                  if (value.length > 32 * 1024) {
                    return "值不能超过 32 KB";
                  }
                  if (form.isSecret && value === "" && !isEditingSecret) {
                    return "密钥变量的值不能为空";
                  }
                  if (!form.isSecret && value === "" && isEditingSecret) {
                    return "改为普通变量时需要重新填写值，原密钥值无法读取";
                  }
                  return true;
                },
              })}
            />
          </Field>

          {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={onClose}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "保存中" : "保存"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function Field({
  children,
  error,
  hint,
  label,
}: {
  children: ReactNode;
  error?: string;
  hint?: string;
  label: string;
}) {
  return (
    <div>
      <div className="mb-2 font-medium text-muted-foreground text-xs">{label}</div>
      {children}
      {error ? <p className="mt-1.5 text-destructive text-xs">{error}</p> : null}
      {!error && hint ? <p className="mt-1.5 text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}
