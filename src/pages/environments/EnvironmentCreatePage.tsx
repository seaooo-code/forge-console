import { ArrowLeft, Layers3, LoaderCircle } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
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
import type { StorageConfigRecord, StorageSnapshot } from "@/pages/storage";

import { createEnvironment } from "./api/environments-snapshot";
import type { EnvironmentCardTone, EnvironmentMutationInput, EnvironmentStatusCode } from "./types";

type EnvironmentCreatePageProps = {
  isFetching?: boolean;
  onBack: () => void;
  onSaved?: (environmentId: string) => void;
  snapshot?: StorageSnapshot | null;
};

type EnvironmentFormState = {
  code: string;
  description: string;
  name: string;
  shortCode: string;
  status: EnvironmentStatusCode;
  storageConfigurationId: string;
  tone: EnvironmentCardTone;
  trafficLabel: string;
};

const defaultForm: EnvironmentFormState = {
  code: "",
  description: "",
  name: "",
  shortCode: "",
  status: "healthy",
  storageConfigurationId: "",
  tone: "blue",
  trafficLabel: "",
};

const statusOptions: Array<{ label: string; value: EnvironmentStatusCode }> = [
  { label: "健康", value: "healthy" },
  { label: "灰度中", value: "gray" },
];

const toneOptions: Array<{ label: string; value: EnvironmentCardTone }> = [
  { label: "蓝色", value: "blue" },
  { label: "天蓝", value: "sky" },
  { label: "绿色", value: "emerald" },
  { label: "琥珀", value: "amber" },
  { label: "玫红", value: "rose" },
];

export function EnvironmentCreatePage({
  isFetching = false,
  onBack,
  onSaved,
  snapshot,
}: EnvironmentCreatePageProps) {
  const storageConfigurations = useMemo(
    () => snapshot?.configurations ?? [],
    [snapshot?.configurations],
  );
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    register,
  } = useForm<EnvironmentFormState>({
    defaultValues: defaultForm,
  });
  const [formError, setFormError] = useState("");

  const handleFormSubmit = async (form: EnvironmentFormState) => {
    const input = buildEnvironmentInput(form);
    const validationError = validateEnvironmentInput(input, storageConfigurations);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");

    try {
      const environment = await createEnvironment(input);
      onSaved?.(environment.id);
    } catch (_error) {
      setFormError("创建环境失败，请稍后重试");
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
              返回环境管理
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <Layers3 className="size-5" />
              </div>
              <div>
                <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">新建环境</h1>
                <p className="mt-2 text-slate-600 text-sm">
                  创建运行环境，并绑定一个对象存储配置作为 Bundle 分发入口
                </p>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" type="button" onClick={onBack}>
              取消
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isSubmitting}>
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              保存环境
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        {formError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-600 text-sm">
            {formError}
          </div>
        ) : null}

        <Card className="rounded-lg border-slate-200 bg-white p-0 shadow-none">
          <FormSectionHeader title="基础信息" description="定义环境唯一标识、名称和运行状态" />
          <div className="grid gap-4 px-5 pb-5 xl:grid-cols-3">
            <Field label="环境 ID" required>
              <Input placeholder="例如：qa" {...register("code")} />
            </Field>
            <Field label="环境短码" required>
              <Input placeholder="例如：QA" {...register("shortCode")} />
            </Field>
            <Field label="环境名称" required>
              <Input placeholder="例如：QA 环境" {...register("name")} />
            </Field>
            <Field label="状态">
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as EnvironmentStatusCode)}
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
            <Field label="视觉标识">
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
            </Field>
            <Field label="流量标签">
              <Input placeholder="例如：研发内网 / 10% 灰度" {...register("trafficLabel")} />
            </Field>
          </div>
        </Card>

        <Card className="rounded-lg border-slate-200 bg-white p-0 shadow-none">
          <FormSectionHeader title="存储关联" description="环境必须绑定一个已创建的存储配置" />
          <div className="grid gap-4 px-5 pb-5 xl:grid-cols-2">
            <Field label="存储配置" required>
              <Controller
                control={control}
                name="storageConfigurationId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isFetching || storageConfigurations.length === 0}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={isFetching ? "加载存储配置中" : "选择一个存储配置"}
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
            </Field>
            <Field label="环境描述">
              <Input placeholder="例如：用于 QA 验收与集成验证" {...register("description")} />
            </Field>
          </div>
        </Card>
      </div>
    </form>
  );
}

function Field({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <span className="font-medium text-slate-700 text-sm">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </span>
      {children}
    </div>
  );
}

function FormSectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="border-slate-200 border-b px-5 py-4">
      <h2 className="font-semibold text-slate-900 text-sm">{title}</h2>
      <p className="mt-1 text-slate-500 text-xs">{description}</p>
    </div>
  );
}

function buildEnvironmentInput(form: EnvironmentFormState): EnvironmentMutationInput {
  return {
    code: form.code.trim(),
    description: form.description.trim(),
    name: form.name.trim(),
    shortCode: form.shortCode.trim(),
    status: form.status,
    storageConfigurationId: form.storageConfigurationId,
    tone: form.tone,
    trafficLabel: form.trafficLabel.trim(),
  };
}

function validateEnvironmentInput(
  input: EnvironmentMutationInput,
  storageConfigurations: StorageConfigRecord[],
) {
  if (storageConfigurations.length === 0) {
    return "请先在存储管理中新增一个存储配置";
  }

  if (!input.code || !input.shortCode || !input.name || !input.storageConfigurationId) {
    return "请完整填写环境 ID、环境短码、环境名称和存储配置";
  }

  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(input.code)) {
    return "环境 ID 需以字母开头，只能包含字母、数字、下划线和中划线";
  }

  return "";
}

function buildStorageOptionLabel(configuration: StorageConfigRecord) {
  return `${configuration.name} · ${configuration.bucket}`;
}
