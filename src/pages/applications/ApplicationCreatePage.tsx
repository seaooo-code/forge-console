import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { PackagePlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { searchFeishuUsers } from "@/api/feishu-user-search";
import { OwnerPicker, type OwnerSearchUser } from "@/components/common/OwnerPicker";
import { FormActions, FormLayout, PageHeader, SectionCard } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { applicationEditQueryKey, applicationsRootQueryKey } from "./api/application-list-filters";
import { createApplication, fetchApplicationDetailSnapshot } from "./api/applications-snapshot";
import {
  ApplicationFormLoading,
  ApplicationFormNotFound,
  ApplicationFormOptionsError,
} from "./components/ApplicationFormFeedback";
import { CheckOption, Field } from "./components/ApplicationFormFields";
import { useApplicationOptions } from "./hooks";
import type {
  ApplicationCreatePageProps,
  ApplicationEnvironmentFieldPath,
  ApplicationFormState,
} from "./types";
import {
  buildApplicationInput,
  buildInitialForm,
  parseApplicationStatusCode,
  updateExistingApplication,
} from "./utils";

export function ApplicationCreatePage({
  applicationSlug,
  mode = "create",
  onBack,
  onSaved,
}: ApplicationCreatePageProps) {
  const queryClient = useQueryClient();
  const isEditMode = mode === "edit";
  const editApplicationSlug = isEditMode ? applicationSlug : undefined;
  const { data: applicationSnapshot, isFetching: isApplicationFetching } = useQuery({
    queryFn: editApplicationSlug
      ? () => fetchApplicationDetailSnapshot(editApplicationSlug)
      : skipToken,
    queryKey: applicationEditQueryKey(editApplicationSlug),
  });
  const application = applicationSlug
    ? applicationSnapshot?.applications.find((item) => item.slug === applicationSlug)
    : undefined;
  const detail = applicationSlug ? applicationSnapshot?.details[applicationSlug] : undefined;
  const {
    data: applicationOptions,
    isError: isApplicationOptionsError,
    isFetching: isApplicationOptionsFetching,
  } = useApplicationOptions();
  const platformOptions = useMemo(() => applicationOptions?.platforms ?? [], [applicationOptions]);
  const statusOptions = useMemo(
    () =>
      applicationOptions?.applicationStatuses.filter(
        (option) => parseApplicationStatusCode(option.value) !== null,
      ) ?? [],
    [applicationOptions],
  );
  const environmentOptions = useMemo(
    () => applicationOptions?.environments ?? [],
    [applicationOptions],
  );
  const initialForm = useMemo(
    () =>
      buildInitialForm(
        isEditMode && application && detail ? { application, detail } : undefined,
        environmentOptions,
        statusOptions,
      ),
    [application, detail, environmentOptions, isEditMode, statusOptions],
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

  if (isEditMode && isApplicationFetching && !(application && detail)) {
    return <ApplicationFormLoading onBack={onBack} />;
  }

  if (isEditMode && !isApplicationFetching && !(application && detail)) {
    return <ApplicationFormNotFound onBack={onBack} />;
  }

  if (isApplicationOptionsFetching && !applicationOptions) {
    return <ApplicationFormLoading onBack={onBack} />;
  }

  if (isApplicationOptionsError && !applicationOptions) {
    return <ApplicationFormOptionsError onBack={onBack} />;
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
    setValue("ownerUserId", "", { shouldDirty: true });
  };

  const handleOwnerSelect = (user: OwnerSearchUser) => {
    setValue("ownerAvatarUrl", user.avatarUrl, { shouldDirty: true });
    setValue("ownerDepartmentIds", user.departmentIds, { shouldDirty: true });
    setValue("ownerEmail", user.email, { shouldDirty: true });
    setValue("ownerUserId", user.id, { shouldDirty: true });
  };

  const handleFormSubmit = async (form: ApplicationFormState) => {
    const status = parseApplicationStatusCode(form.status);

    if (!status) {
      setFormError("请完整填写基础信息，并至少选择一个平台和一个环境");
      return;
    }

    const input = buildApplicationInput(form, environmentOptions, status);
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

    if (!input.ownerUserId) {
      setFormError("请从搜索结果中选择负责人");
      return;
    }

    setFormError("");

    try {
      if (isEditMode && !applicationSlug) {
        setFormError("应用路径无效");
        return;
      }

      const payload = isEditMode
        ? await updateExistingApplication(applicationSlug, input)
        : await createApplication(input);
      await queryClient.invalidateQueries({ queryKey: applicationsRootQueryKey });
      onSaved?.(payload.application.slug);
    } catch (_error) {
      setFormError(isEditMode ? "保存应用失败，请稍后重试" : "创建应用失败，请稍后重试");
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit(handleFormSubmit)}>
      <PageHeader
        onBack={onBack}
        backLabel="返回应用管理"
        breadcrumbs={[{ label: "应用管理", href: "/apps" }, { label: title }]}
        title={
          <span className="flex items-center gap-2">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
              <PackagePlus className="size-5" />
            </span>
            <span>{title}</span>
          </span>
        }
        description={description}
        actions={
          <>
            <Button variant="outline" type="button" onClick={onBack} size="sm">
              取消
            </Button>
            <Button type="submit" size="sm" disabled={isSubmitting} loading={isSubmitting}>
              {isEditMode ? "保存修改" : "创建应用"}
            </Button>
          </>
        }
      />

      {formError ? (
        <Alert variant="danger" className="border-destructive/30 bg-destructive/10">
          {formError}
        </Alert>
      ) : null}

      <SectionCard
        title="基础信息"
        description="应用唯一标识、平台、负责人和启用环境"
        actions={
          <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
            必填
          </span>
        }
      >
        <FormLayout>
          <Field label="应用名称" className="md:col-span-1">
            <Input placeholder="输入应用名称" {...register("name")} />
          </Field>
          <Field label="应用标识" className="md:col-span-1">
            <Input
              aria-disabled={isEditMode}
              className={isEditMode ? "cursor-not-allowed opacity-50" : undefined}
              placeholder="例如 mi-car-global"
              readOnly={isEditMode}
              {...register("slug")}
            />
          </Field>
          <Field label="负责人" className="md:col-span-1">
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
          <Field label="应用状态" className="md:col-span-1">
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(parseApplicationStatusCode(value) ?? "")}
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
          <Field label="应用描述" className="md:col-span-2">
            <Input placeholder="输入应用说明" {...register("description")} />
          </Field>
        </FormLayout>
      </SectionCard>

      <SectionCard
        title="接入范围"
        description="选择应用支持的平台与启用的环境"
        actions={
          <span className="rounded-md bg-success/10 px-2 py-0.5 font-medium text-success text-xs">
            必填
          </span>
        }
      >
        <div className="space-y-5">
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

          <Field label="环境接入">
            <div className="grid gap-2 md:grid-cols-3 xl:grid-cols-5">
              {environmentOptions.map((environment) => (
                <Controller
                  key={environment.value}
                  control={control}
                  name={`environments.${environment.value}` as ApplicationEnvironmentFieldPath}
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
        </div>
      </SectionCard>

      <FormActions
        hint={
          isEditMode
            ? "保存后立即生效，影响所有访问该应用的客户端"
            : "创建后可继续在详情页调整接入配置"
        }
        primary={
          <Button type="submit" size="sm" disabled={isSubmitting} loading={isSubmitting}>
            {isEditMode ? "保存修改" : "创建应用"}
          </Button>
        }
        secondary={
          <Button variant="outline" type="button" size="sm" onClick={onBack}>
            取消
          </Button>
        }
      />
    </form>
  );
}
