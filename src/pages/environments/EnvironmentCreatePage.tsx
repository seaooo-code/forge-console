import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Layers3, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { fetchAllStorageConfigurationsSnapshot } from "@/api/storage-configurations";
import { FormSectionField, FormSectionHeader } from "@/components/common/FormSectionHeader";
import { Alert } from "@/components/ui/alert";
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
import type { StorageConfigRecord } from "@/types/storage";

import {
  environmentEditQueryKey,
  environmentStorageOptionsQueryKey,
  environmentsSnapshotQueryKey,
} from "./api/environment-query-keys";
import {
  createEnvironment,
  fetchEnvironmentDetailSnapshot,
  updateEnvironment,
} from "./api/environments-snapshot";
import { defaultForm, toneOptions } from "./constants";
import type {
  EnvironmentCardTone,
  EnvironmentFormState,
  EnvironmentMutationInput,
  RuntimeEnvironment,
} from "./types";

type EnvironmentCreatePageProps = {
  environmentId?: string;
  mode?: "create" | "edit";
  onBack: () => void;
  onSaved?: (environmentId: string) => void;
};

export function EnvironmentCreatePage({
  environmentId,
  mode = "create",
  onBack,
  onSaved,
}: EnvironmentCreatePageProps) {
  const queryClient = useQueryClient();
  const isEditMode = mode === "edit";
  const editEnvironmentId = isEditMode ? environmentId : undefined;
  const storageOptionsScope = editEnvironmentId ? editEnvironmentId : "new";
  const { data: environmentSnapshot, isFetching: isEnvironmentFetching } = useQuery({
    queryFn: editEnvironmentId
      ? () => fetchEnvironmentDetailSnapshot(editEnvironmentId)
      : skipToken,
    queryKey: environmentEditQueryKey(editEnvironmentId),
  });
  const { data: storageSnapshot, isFetching: isStorageFetching } = useQuery({
    queryFn: fetchAllStorageConfigurationsSnapshot,
    queryKey: environmentStorageOptionsQueryKey(storageOptionsScope),
  });
  const environment = editEnvironmentId
    ? environmentSnapshot?.details[editEnvironmentId]
    : undefined;
  const storageConfigurations = useMemo(
    () => storageSnapshot?.configurations ?? [],
    [storageSnapshot?.configurations],
  );
  const initialForm = useMemo(
    () => buildInitialForm(isEditMode ? environment : undefined),
    [environment, isEditMode],
  );
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<EnvironmentFormState>({
    defaultValues: initialForm,
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    reset(initialForm);
    setFormError("");
  }, [initialForm, reset]);

  if (
    (isEditMode && isEnvironmentFetching && !environment) ||
    (isStorageFetching && !storageSnapshot)
  ) {
    return <EnvironmentFormLoading onBack={onBack} />;
  }

  if (isEditMode && !isEnvironmentFetching && !environment) {
    return <EnvironmentFormNotFound onBack={onBack} />;
  }

  const title = isEditMode ? "编辑环境" : "新建环境";
  const description = isEditMode
    ? "维护运行环境的展示信息和存储配置关联"
    : "创建运行环境，并绑定一个对象存储配置作为 Bundle 分发入口";

  const handleFormSubmit = async (form: EnvironmentFormState) => {
    const input = buildEnvironmentInput(form, isEditMode ? environment : undefined);
    const validationError = validateEnvironmentInput(input, storageConfigurations);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");

    try {
      if (isEditMode && !environmentId) {
        setFormError("环境路径无效");
        return;
      }

      const savedEnvironment = isEditMode
        ? await updateExistingEnvironment(environmentId, input)
        : await createEnvironment(input);
      await queryClient.invalidateQueries({ queryKey: environmentsSnapshotQueryKey });
      onSaved?.(savedEnvironment.id);
    } catch (_error) {
      setFormError(isEditMode ? "保存环境失败，请稍后重试" : "创建环境失败，请稍后重试");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="bg-card px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Button
              variant="ghost"
              type="button"
              className="-ml-2 mb-3 h-8 gap-2 px-2 text-muted-foreground hover:bg-hover hover:text-foreground"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
              返回环境管理
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Layers3 className="size-5" />
              </div>
              <div>
                <h1 className="font-semibold text-2xl text-foreground tracking-tight">{title}</h1>
                <p className="mt-2 text-muted-foreground text-sm">{description}</p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" type="button" onClick={onBack}>
              取消
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {isEditMode ? "保存修改" : "保存环境"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        {formError ? <Alert variant="danger">{formError}</Alert> : null}

        <Card className="rounded-lg bg-card p-0">
          <FormSectionHeader title="基础信息" description="定义环境唯一标识、名称和视觉标识" />
          <div className="grid gap-4 px-5 pb-5 xl:grid-cols-3">
            <FormSectionField label="环境 ID" required>
              <Input
                readOnly={isEditMode}
                className={isEditMode ? "bg-muted text-muted-foreground" : undefined}
                placeholder="例如：qa"
                {...register("code")}
              />
            </FormSectionField>
            <FormSectionField label="环境名称" required>
              <Input placeholder="例如：QA 环境" {...register("name")} />
            </FormSectionField>
            <FormSectionField label="视觉标识">
              <Controller
                control={control}
                name="tone"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as EnvironmentCardTone)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {toneOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormSectionField>
          </div>
        </Card>

        <Card className="rounded-lg bg-card p-0">
          <FormSectionHeader title="存储关联" description="环境必须绑定一个已创建的存储配置" />
          <div className="grid gap-4 px-5 pb-5 xl:grid-cols-2">
            <FormSectionField label="存储配置" required>
              <Controller
                control={control}
                name="storageConfigurationId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isStorageFetching || storageConfigurations.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={isStorageFetching ? "加载存储配置中" : "选择一个存储配置"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {storageConfigurations.map((configuration) => (
                        <SelectItem key={configuration.id} value={configuration.id}>
                          {buildStorageOptionLabel(configuration)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </FormSectionField>
            <FormSectionField label="环境描述">
              <Input placeholder="例如：用于 QA 验收与集成验证" {...register("description")} />
            </FormSectionField>
          </div>
        </Card>
      </div>
    </form>
  );
}

async function updateExistingEnvironment(
  environmentId: string | undefined,
  input: EnvironmentMutationInput,
) {
  if (!environmentId) {
    throw new Error("Environment id is required");
  }

  return updateEnvironment(environmentId, input);
}

function EnvironmentFormLoading({ onBack }: { onBack: () => void }) {
  return (
    <>
      <div className="bg-card px-6 py-5">
        <Button
          variant="ghost"
          type="button"
          className="-ml-2 mb-3 h-8 gap-2 px-2 text-muted-foreground hover:bg-hover hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          返回环境管理
        </Button>
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4 px-6 py-5">
        <Card className="h-48 animate-pulse rounded-lg bg-card" />
        <Card className="h-48 animate-pulse rounded-lg bg-card" />
      </div>
    </>
  );
}

function EnvironmentFormNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-card px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 mb-3 h-8 gap-2 px-2 text-muted-foreground hover:bg-hover hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回环境管理
      </Button>
      <h1 className="font-semibold text-2xl text-foreground tracking-tight">环境不存在</h1>
      <p className="mt-2 text-muted-foreground text-sm">当前环境不存在或路径无效。</p>
    </div>
  );
}

function buildInitialForm(environment?: RuntimeEnvironment): EnvironmentFormState {
  if (!environment) {
    return defaultForm;
  }

  return {
    code: environment.id,
    description: environment.description,
    name: environment.name,
    status: environment.status,
    storageConfigurationId: environment.storageConfigurationId,
    tone: environment.tone,
  };
}

function buildEnvironmentInput(
  form: EnvironmentFormState,
  environment?: RuntimeEnvironment,
): EnvironmentMutationInput {
  return {
    code: form.code.trim(),
    description: form.description.trim(),
    name: form.name.trim(),
    status: form.status ?? environment?.status ?? defaultForm.status,
    storageConfigurationId: form.storageConfigurationId,
    tone: form.tone,
  };
}

function validateEnvironmentInput(
  input: EnvironmentMutationInput,
  storageConfigurations: StorageConfigRecord[],
) {
  if (storageConfigurations.length === 0) {
    return "请先在存储管理中新增一个存储配置";
  }

  if (!input.code || !input.name || !input.storageConfigurationId) {
    return "请完整填写环境 ID、环境名称和存储配置";
  }

  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(input.code)) {
    return "环境 ID 需以字母开头，只能包含字母、数字、下划线和中划线";
  }

  return "";
}

function buildStorageOptionLabel(configuration: StorageConfigRecord) {
  return `${configuration.name} · ${configuration.bucket}`;
}
