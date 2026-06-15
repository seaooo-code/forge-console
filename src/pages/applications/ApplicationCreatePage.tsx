import {
  ArrowLeft,
  CircleAlert,
  type LucideIcon,
  MonitorSmartphone,
  PackagePlus,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Controller, type FieldPath, useForm } from "react-hook-form";

import { OwnerPicker, type OwnerSearchUser } from "@/components/common/OwnerPicker";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApplicationOptionsStore } from "@/store/use-application-options-store";

import { createApplication, updateApplication } from "./api/applications-snapshot";
import { searchFeishuUsers } from "./api/feishu-user-search";
import { useEnsureApplicationOptions } from "./hooks/use-application-options";
import type {
  ApplicationDetail,
  ApplicationEnvironmentInput,
  ApplicationMutationInput,
  ApplicationOption,
  ApplicationStatusCode,
  ApplicationsSnapshot,
  HostApplication,
} from "./types";

type ApplicationCreatePageProps = {
  applicationSlug?: string;
  isFetching?: boolean;
  mode?: "create" | "edit";
  onBack: () => void;
  onSaved?: (applicationSlug: string) => void;
  snapshot?: ApplicationsSnapshot | null;
};

type EnvironmentCode = ApplicationEnvironmentInput["environment"];

type EnvironmentFormState = Record<string, boolean>;

type ApplicationFormState = {
  description: string;
  environments: EnvironmentFormState;
  name: string;
  owner: string;
  ownerAvatarUrl: string;
  ownerDepartmentIds: string[];
  ownerEmail: string;
  platforms: string[];
  slug: string;
  status: ApplicationStatusCode;
};

const fallbackPlatformOptions: ApplicationOption[] = [
  { label: "iOS", value: "iOS" },
  { label: "Android", value: "Android" },
  { label: "HarmonyOS", value: "HarmonyOS" },
];

const fallbackEnvironmentOptions: ApplicationOption[] = [];

const fallbackStatusOptions: ApplicationOption[] = [
  { label: "运行中", value: "running" },
  { label: "维护中", value: "maintenance" },
  { label: "已下线", value: "offline" },
];

export function ApplicationCreatePage({
  applicationSlug,
  isFetching = false,
  mode = "create",
  onBack,
  onSaved,
  snapshot,
}: ApplicationCreatePageProps) {
  useEnsureApplicationOptions();
  const isEditMode = mode === "edit";
  const application = applicationSlug
    ? snapshot?.applications.find((item) => item.slug === applicationSlug)
    : undefined;
  const detail = applicationSlug ? snapshot?.details[applicationSlug] : undefined;
  const applicationOptions = useApplicationOptionsStore((state) => state.options);
  const platformOptions = applicationOptions?.platforms ?? fallbackPlatformOptions;
  const statusOptions = applicationOptions?.applicationStatuses ?? fallbackStatusOptions;
  const environmentOptions = applicationOptions?.environments ?? fallbackEnvironmentOptions;
  const initialForm = useMemo(
    () => buildInitialForm(isEditMode ? detail : undefined, application, environmentOptions),
    [application, detail, environmentOptions, isEditMode],
  );
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<ApplicationFormState>({
    defaultValues: initialForm,
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    reset(initialForm);
    setFormError("");
  }, [initialForm, reset]);

  if (isEditMode && isFetching && !(application && detail)) {
    return <ApplicationFormLoading onBack={onBack} />;
  }

  const title = isEditMode ? "编辑应用" : "新建应用";
  const description = isEditMode
    ? "维护宿主应用的基础配置和环境接入"
    : "接入新的宿主应用，初始化 RN Bundle 环境";

  const handleOwnerChange = (value: string) => {
    setValue("owner", value, { shouldDirty: true, shouldTouch: true });
    setValue("ownerAvatarUrl", "", { shouldDirty: true });
    setValue("ownerDepartmentIds", [], { shouldDirty: true });
    setValue("ownerEmail", "", { shouldDirty: true });
  };

  const handleOwnerSelect = (user: OwnerSearchUser & { departmentIds?: string[] }) => {
    setValue("ownerAvatarUrl", user.avatarUrl ?? "", { shouldDirty: true });
    setValue("ownerDepartmentIds", user.departmentIds ?? [], { shouldDirty: true });
    setValue("ownerEmail", user.email ?? "", { shouldDirty: true });
  };

  const handleFormSubmit = async (form: ApplicationFormState) => {
    const input = buildApplicationInput(form, environmentOptions);
    if (
      !input.slug ||
      !input.name ||
      !input.platform ||
      !input.owner ||
      !input.description ||
      input.environments.length === 0
    ) {
      setFormError("请完整填写基础信息，并至少选择一个平台和一个环境");
      return;
    }

    setFormError("");

    try {
      const payload = isEditMode
        ? await updateApplication(applicationSlug ?? "", input)
        : await createApplication(input);
      onSaved?.(payload.application.slug);
    } catch (_error) {
      setFormError(isEditMode ? "保存应用失败，请稍后重试" : "创建应用失败，请稍后重试");
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
              返回应用管理
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
              {isSubmitting ? "保存中" : isEditMode ? "保存修改" : "创建应用"}
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
          <SectionHeader
            icon={MonitorSmartphone}
            title="应用接入信息"
            description="应用唯一标识、平台、负责人和启用环境"
          />
          <div className="space-y-5 p-4">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-blue-500" />
                <h2 className="font-semibold text-slate-900 text-sm">基础信息</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
                <Field label="应用名称" className="xl:col-span-4">
                  <Input placeholder="输入应用名称" {...register("name")} />
                </Field>
                <Field label="应用标识" className="xl:col-span-4">
                  <Input
                    aria-disabled={isEditMode}
                    className={isEditMode ? "cursor-not-allowed opacity-50" : undefined}
                    placeholder="例如 mi-car-global"
                    readOnly={isEditMode}
                    {...register("slug")}
                  />
                </Field>
                <Field label="负责人" className="xl:col-span-4">
                  <Controller
                    control={control}
                    name="owner"
                    render={({ field }) => (
                      <OwnerPicker
                        inputName={field.name}
                        inputRef={field.ref}
                        value={field.value}
                        searchUsers={searchFeishuUsers}
                        onBlur={field.onBlur}
                        onChange={handleOwnerChange}
                        onSelect={handleOwnerSelect}
                      />
                    )}
                  />
                </Field>
                <Field label="应用状态" className="xl:col-span-4">
                  <Controller
                    control={control}
                    name="status"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => field.onChange(value as ApplicationStatusCode)}
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
                <Field label="应用描述" className="md:col-span-2 xl:col-span-8">
                  <Input placeholder="输入应用说明" {...register("description")} />
                </Field>
              </div>
            </section>

            <section className="border-slate-100 border-t pt-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-emerald-500" />
                <h2 className="font-semibold text-slate-900 text-sm">接入范围</h2>
              </div>
              <Field label="接入平台">
                <Controller
                  control={control}
                  name="platforms"
                  render={({ field }) => (
                    <div className="grid gap-2 md:grid-cols-3">
                      {platformOptions.map((platform) => {
                        const selectedPlatforms = field.value ?? [];

                        return (
                          <CheckOption
                            key={platform.value}
                            checked={selectedPlatforms.includes(platform.value)}
                            label={platform.label}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                checked
                                  ? Array.from(new Set([...selectedPlatforms, platform.value]))
                                  : selectedPlatforms.filter((item) => item !== platform.value),
                              )
                            }
                          />
                        );
                      })}
                    </div>
                  )}
                />
              </Field>
              <Field label="环境接入" className="mt-4">
                <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
                  {environmentOptions.map((environment) => (
                    <Controller
                      key={environment.value}
                      control={control}
                      name={toEnvironmentFieldPath(environment.value)}
                      render={({ field }) => (
                        <CheckOption
                          checked={Boolean(field.value)}
                          label={environment.label}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  ))}
                </div>
              </Field>
            </section>
          </div>
        </Card>
      </div>
    </form>
  );
}

function toEnvironmentFieldPath(environment: string) {
  return `environments.${environment}` as FieldPath<ApplicationFormState>;
}

function buildInitialForm(
  detail?: ApplicationDetail,
  application?: HostApplication,
  environmentOptions: ApplicationOption[] = fallbackEnvironmentOptions,
): ApplicationFormState {
  const slug = detail?.slug ?? application?.slug ?? "";
  const platform = application?.platform ?? "";

  return {
    description: detail?.description ?? "",
    environments: buildEnvironmentState(detail, environmentOptions),
    name: detail?.name ?? application?.name ?? "",
    owner: application?.owner ?? "",
    ownerAvatarUrl: detail?.ownerAvatarUrl ?? application?.ownerAvatarUrl ?? "",
    ownerDepartmentIds: detail?.ownerDepartmentIds ?? application?.ownerDepartmentIds ?? [],
    ownerEmail: detail?.ownerEmail ?? application?.ownerEmail ?? "",
    platforms: platform === "" ? [] : platform.split("/").map((item) => item.trim()),
    slug,
    status: toStatusCode(application?.status),
  };
}

function buildEnvironmentState(
  detail?: ApplicationDetail,
  environmentOptions: ApplicationOption[] = fallbackEnvironmentOptions,
): EnvironmentFormState {
  const enabledEnvironments = new Map(
    detail?.environments.map((environment) => [environment.environment, environment]) ?? [],
  );

  return Object.fromEntries(
    environmentOptions.map((environment) => [
      environment.value,
      detail ? enabledEnvironments.has(environment.value) : true,
    ]),
  );
}

function buildApplicationInput(
  form: ApplicationFormState,
  environmentOptions: ApplicationOption[],
): ApplicationMutationInput {
  const environments = environmentOptions
    .filter((environment) => form.environments[environment.value])
    .map((environment) => ({
      environment: environment.value as EnvironmentCode,
    }));

  return {
    description: form.description.trim(),
    environments,
    name: form.name.trim(),
    owner: form.owner.trim(),
    ownerAvatarUrl: form.ownerAvatarUrl.trim(),
    ownerDepartmentIds: form.ownerDepartmentIds,
    ownerEmail: form.ownerEmail.trim(),
    platform: form.platforms.join(" / "),
    slug: form.slug.trim(),
    status: form.status,
  };
}

function toStatusCode(status?: HostApplication["status"]): ApplicationStatusCode {
  switch (status) {
    case "维护中":
      return "maintenance";
    case "已下线":
      return "offline";
    default:
      return "running";
  }
}

function ApplicationFormLoading({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4 px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回应用管理
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

function SectionHeader({
  description,
  icon: Icon,
  title,
}: {
  description: string;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div className="flex h-14 items-center gap-3 border-slate-200 border-b px-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        <Icon className="size-4" />
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

function CheckOption({
  checked,
  label,
  onCheckedChange,
}: {
  checked?: boolean;
  label: string;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-slate-700 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange?.(value === true)} />
      <span>{label}</span>
    </div>
  );
}
