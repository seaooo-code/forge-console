import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Box, CircleAlert, LoaderCircle, PackagePlus } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  createModule,
  fetchModuleDetailSnapshot,
  moduleEditQueryKey,
  modulesSnapshotQueryKey,
  updateModule,
} from "./api/modules-snapshot";
import { defaultForm, kindOptions, moduleApplicationOptions, statusOptions } from "./constants";
import type {
  ModuleFormState,
  ModuleKind,
  ModuleMutationInput,
  ModuleRecord,
  ModuleStatus,
} from "./types";

type ModuleCreatePageProps = {
  mode?: "create" | "edit";
  moduleId?: string;
  onBack: () => void;
  onSaved?: (moduleId: string) => void;
};

export function ModuleCreatePage({
  mode = "create",
  moduleId,
  onBack,
  onSaved,
}: ModuleCreatePageProps) {
  const queryClient = useQueryClient();
  const isEditMode = mode === "edit";
  const editModuleId = isEditMode ? moduleId : undefined;
  const { data: moduleSnapshot, isFetching } = useQuery({
    queryFn: editModuleId ? () => fetchModuleDetailSnapshot(editModuleId) : skipToken,
    queryKey: moduleEditQueryKey(editModuleId),
  });
  const moduleRecord = editModuleId ? moduleSnapshot?.modules[0] : undefined;
  const initialForm = useMemo(
    () => buildInitialForm(isEditMode ? moduleRecord : undefined),
    [isEditMode, moduleRecord],
  );
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ModuleFormState>({
    defaultValues: initialForm,
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    reset(initialForm);
    setFormError("");
  }, [initialForm, reset]);

  if (isEditMode && isFetching && !moduleRecord) {
    return <ModuleFormLoading onBack={onBack} />;
  }

  if (isEditMode && !isFetching && !moduleRecord) {
    return <ModuleFormNotFound onBack={onBack} />;
  }

  const title = isEditMode ? "编辑模块" : "新建模块";
  const description = isEditMode
    ? "维护模块仓库、负责人和启停状态"
    : "登记新的 RN 模块仓库，用于 Bundle 产物管理";

  const handleFormSubmit = async (form: ModuleFormState) => {
    const input = buildModuleInput(form);
    const validationError = validateModuleInput(input);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");

    try {
      if (isEditMode && !moduleId) {
        setFormError("模块路径无效");
        return;
      }

      const savedModule = isEditMode
        ? await updateExistingModule(moduleId, input)
        : await createModule(input);
      await queryClient.invalidateQueries({ queryKey: modulesSnapshotQueryKey });
      onSaved?.(savedModule.id);
    } catch (_error) {
      setFormError(isEditMode ? "保存模块失败，请稍后重试" : "创建模块失败，请确认模块 ID 未重复");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Button
              variant="ghost"
              type="button"
              className="-ml-2 mb-3 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
              返回模块管理
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <PackagePlus className="size-5" />
              </div>
              <div>
                <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">{title}</h1>
                <p className="mt-2 text-slate-600 text-sm">{description}</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" type="button" onClick={onBack}>
              取消
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {isEditMode ? "保存修改" : "创建模块"}
            </Button>
          </div>
        </div>
        {formError ? (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 text-sm">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {formError}
          </div>
        ) : null}
      </div>

      <div className="px-6 py-5">
        <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
          <SectionHeader title="模块基础信息" description="模块唯一标识、关联应用和仓库地址" />
          <div className="space-y-5 p-4">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-blue-500" />
                <h2 className="font-semibold text-slate-900 text-sm">基础信息</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
                <Field label="模块 ID" className="xl:col-span-4">
                  <Input
                    readOnly={isEditMode}
                    aria-disabled={isEditMode}
                    className={isEditMode ? "cursor-not-allowed bg-slate-50 text-slate-500" : ""}
                    placeholder="例如：module-profile"
                    {...register("id")}
                  />
                </Field>
                <Field label="模块名称" className="xl:col-span-4">
                  <Input placeholder="例如：profile" {...register("name")} />
                </Field>
                <Field label="关联应用" className="xl:col-span-4">
                  <Controller
                    control={control}
                    name="applicationId"
                    render={({ field }) => (
                      <Select
                        value={field.value || initialForm.applicationId}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {moduleApplicationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="负责人" className="xl:col-span-4">
                  <Input placeholder="例如：li.ming" {...register("owner")} />
                </Field>
                <Field label="模块类型" className="xl:col-span-4">
                  <Controller
                    control={control}
                    name="kind"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as ModuleKind)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {kindOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
                <Field label="模块状态" className="xl:col-span-4">
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as ModuleStatus)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>
              </div>
            </section>

            <section className="border-slate-100 border-t pt-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-emerald-500" />
                <h2 className="font-semibold text-slate-900 text-sm">仓库信息</h2>
              </div>
              <Field label="Git 仓库地址">
                <Input
                  placeholder="例如：git@git.mi.com:mi-car-rn/profile.git"
                  {...register("repository")}
                />
              </Field>
            </section>
          </div>
        </Card>
      </div>
    </form>
  );
}

async function updateExistingModule(moduleId: string | undefined, input: ModuleMutationInput) {
  if (!moduleId) {
    throw new Error("Module id is required");
  }

  return updateModule(moduleId, input);
}

function buildInitialForm(moduleRecord?: ModuleRecord): ModuleFormState {
  if (!moduleRecord) {
    return { ...defaultForm };
  }

  return {
    applicationId: resolveModuleApplicationId(moduleRecord),
    id: moduleRecord.id,
    kind: moduleRecord.kind,
    name: moduleRecord.name,
    owner: moduleRecord.owner,
    repository: moduleRecord.repository,
    status: moduleRecord.status,
  };
}

function buildModuleInput(form: ModuleFormState): ModuleMutationInput {
  return {
    applicationId: form.applicationId || defaultForm.applicationId,
    id: form.id.trim(),
    kind: form.kind,
    name: form.name.trim(),
    owner: form.owner.trim(),
    repository: form.repository.trim(),
    status: form.status,
  };
}

function resolveModuleApplicationId(moduleRecord: ModuleRecord) {
  if (moduleApplicationOptions.some((option) => option.value === moduleRecord.applicationId)) {
    return moduleRecord.applicationId;
  }

  return (
    moduleApplicationOptions.find((option) => option.label === moduleRecord.applicationName)
      ?.value ?? defaultForm.applicationId
  );
}

function validateModuleInput(input: ModuleMutationInput) {
  if (!input.applicationId || !input.id || !input.name || !input.owner || !input.repository) {
    return "请完整填写模块 ID、名称、关联应用、负责人和仓库地址";
  }

  if (/\s/.test(input.id)) {
    return "模块 ID 不能包含空格";
  }

  return "";
}

function ModuleFormLoading({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4 px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回模块管理
      </Button>
      <Card className="rounded-lg border-slate-200 p-6 shadow-none">
        <div className="space-y-3">
          <div className="h-5 w-36 animate-pulse rounded bg-slate-100" />
          <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-40 w-full animate-pulse rounded bg-slate-100" />
        </div>
      </Card>
    </div>
  );
}

function ModuleFormNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4 px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回模块管理
      </Button>
      <Card className="rounded-lg border-slate-200 bg-white p-6 shadow-none">
        <div className="font-semibold text-slate-900 text-sm">模块不存在</div>
        <p className="mt-1 text-slate-500 text-sm">当前模块可能已被删除或路径无效。</p>
      </Card>
    </div>
  );
}

function SectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex h-14 items-center gap-3 border-slate-200 border-b px-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        <Box className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-slate-900 text-sm">{title}</div>
        <div className="truncate text-slate-500 text-xs">{description}</div>
      </div>
    </div>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={className}>
      <div className="mb-2 font-medium text-slate-600 text-xs">{label}</div>
      {children}
    </div>
  );
}
