import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Box, GitFork, LoaderCircle, PackagePlus } from "lucide-react";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { searchFeishuUsers } from "@/api/feishu-user-search";
import { OwnerPicker } from "@/components/common/OwnerPicker";
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
import { applicationsRootQueryKey, fetchApplicationsSnapshot } from "@/pages/applications";
import { codeSourcesSnapshotQueryKey, fetchCodeSourcesSnapshot } from "@/pages/code-sources";
import type { FeishuUserSearchResult } from "@/types/feishu";

import {
  createModule,
  fetchModuleDetailSnapshot,
  fetchModulesSnapshot,
  moduleEditQueryKey,
  modulesRootQueryKey,
  modulesSnapshotQueryKey,
  searchCodeSourceRepositories,
  updateModule,
} from "./api/modules-snapshot";
import { defaultForm, kindOptions } from "./constants";
import type {
  ModuleFormState,
  ModuleKind,
  ModuleMutationInput,
  ModuleRecord,
  ModuleRepositoryBinding,
} from "./types";

type ModuleCreatePageProps = {
  mode?: "create" | "edit";
  moduleId?: string;
  onBack: () => void;
  onOpenCodeSources?: () => void;
  onSaved?: (moduleId: string) => void;
};

export function ModuleCreatePage({
  mode = "create",
  moduleId,
  onBack,
  onOpenCodeSources,
  onSaved,
}: ModuleCreatePageProps) {
  const queryClient = useQueryClient();
  const isEditMode = mode === "edit";
  const editModuleId = isEditMode ? moduleId : undefined;
  const { data: applicationSnapshot, isFetching: isApplicationsFetching } = useQuery({
    queryFn: () => fetchApplicationsSnapshot(),
    queryKey: applicationsRootQueryKey,
  });
  const { data: moduleSnapshot, isFetching: isModuleFetching } = useQuery({
    queryFn: editModuleId ? () => fetchModuleDetailSnapshot(editModuleId) : skipToken,
    queryKey: moduleEditQueryKey(editModuleId),
  });
  const { data: codeSourceSnapshot, isFetching: isCodeSourcesFetching } = useQuery({
    queryFn: isEditMode ? skipToken : fetchCodeSourcesSnapshot,
    queryKey: codeSourcesSnapshotQueryKey,
  });
  const applicationOptions = useMemo(
    () =>
      applicationSnapshot?.applications.map((application) => ({
        label: application.name,
        value: application.id,
      })) ?? [],
    [applicationSnapshot],
  );
  const moduleRecord = editModuleId ? moduleSnapshot?.modules[0] : undefined;
  const initialForm = useMemo(
    () => buildInitialForm(isEditMode ? moduleRecord : undefined, applicationOptions[0]?.value),
    [applicationOptions, isEditMode, moduleRecord],
  );
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<ModuleFormState>({
    defaultValues: initialForm,
  });
  const selectedApplicationId = useWatch({ control, name: "applicationId" });
  const selectedKind = useWatch({ control, name: "kind" });
  const shouldLoadCommonModules = selectedKind === "Feature" && selectedApplicationId !== "";
  const commonModuleFilters = useMemo(
    () => ({
      applicationId: shouldLoadCommonModules ? selectedApplicationId : "",
      kind: "Common" as const,
    }),
    [selectedApplicationId, shouldLoadCommonModules],
  );
  const { data: commonModuleSnapshot } = useQuery({
    queryFn: shouldLoadCommonModules ? () => fetchModulesSnapshot(commonModuleFilters) : skipToken,
    queryKey: modulesSnapshotQueryKey(commonModuleFilters),
  });
  const [formError, setFormError] = useState("");
  const hasInstalledCodeSource = codeSourceSnapshot?.apps.some((app) => app.status === "installed");
  const commonModuleOptions = useMemo(
    () =>
      commonModuleSnapshot?.modules.filter(
        (module) => module.applicationId === selectedApplicationId && module.id !== editModuleId,
      ) ?? [],
    [commonModuleSnapshot, editModuleId, selectedApplicationId],
  );

  useEffect(() => {
    reset(initialForm);
    setFormError("");
  }, [initialForm, reset]);

  if (
    (isEditMode && isModuleFetching && !moduleRecord) ||
    (isApplicationsFetching && !applicationSnapshot)
  ) {
    return <ModuleFormLoading onBack={onBack} />;
  }

  if (!isEditMode && isCodeSourcesFetching && !codeSourceSnapshot) {
    return <ModuleFormLoading onBack={onBack} />;
  }

  if (!isEditMode && codeSourceSnapshot && !hasInstalledCodeSource) {
    return <ModuleCodeSourceRequired onBack={onBack} onOpenCodeSources={onOpenCodeSources} />;
  }

  if (isEditMode && !isModuleFetching && !moduleRecord) {
    return <ModuleFormNotFound onBack={onBack} />;
  }

  const title = isEditMode ? "编辑模块" : "新建模块";
  const description = isEditMode
    ? "维护模块仓库、负责人和模块关系"
    : "登记新的模块仓库，并绑定归属应用与负责人";
  const moduleIdField = register("id");
  const moduleNameField = register("name");

  const clearFormError = () => {
    if (formError) {
      setFormError("");
    }
  };

  const handleOwnerChange = (value: string) => {
    clearFormError();
    setValue("owner", value, { shouldDirty: true, shouldTouch: true });
    setValue("ownerAvatarUrl", "", { shouldDirty: true });
    setValue("ownerDepartmentIds", [], { shouldDirty: true });
    setValue("ownerEmail", "", { shouldDirty: true });
    setValue("ownerFeishuOpenId", "", { shouldDirty: true });
    setValue("ownerFeishuUnionId", "", { shouldDirty: true });
    setValue("ownerFeishuUserId", "", { shouldDirty: true });
    setValue("ownerUserId", "", { shouldDirty: true });
  };

  const handleOwnerSelect = (user: FeishuUserSearchResult) => {
    clearFormError();
    setValue("owner", user.name, { shouldDirty: true, shouldTouch: true });
    setValue("ownerAvatarUrl", user.avatarUrl, { shouldDirty: true });
    setValue("ownerDepartmentIds", user.departmentIds, { shouldDirty: true });
    setValue("ownerEmail", user.email, { shouldDirty: true });
    setValue("ownerFeishuOpenId", user.openId, { shouldDirty: true });
    setValue("ownerFeishuUnionId", user.unionId, { shouldDirty: true });
    setValue("ownerFeishuUserId", user.userId, { shouldDirty: true });
    setValue("ownerUserId", getOwnerUserId(user), { shouldDirty: true, shouldTouch: true });
  };

  const handleRepositoryChange = (repository: ModuleRepositoryBinding | null) => {
    clearFormError();
    setValue("repository", repository, { shouldDirty: true, shouldTouch: true });
    setValue("repositoryKeyword", repository?.fullName ?? "", {
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleApplicationChange = (value: string) => {
    clearFormError();
    setValue("applicationId", value, { shouldDirty: true, shouldTouch: true });
    setValue("commonModuleId", "", { shouldDirty: true, shouldTouch: true });
  };

  const handleKindChange = (value: ModuleKind) => {
    clearFormError();
    setValue("kind", value, { shouldDirty: true, shouldTouch: true });
    if (value === "Common") {
      setValue("commonModuleId", "", { shouldDirty: true, shouldTouch: true });
    }
  };

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
      await queryClient.invalidateQueries({ queryKey: modulesRootQueryKey });
      await queryClient.invalidateQueries({ queryKey: applicationsRootQueryKey });
      onSaved?.(savedModule.id);
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : isEditMode
            ? "保存模块失败，请稍后重试"
            : "创建模块失败，请确认模块 ID 未重复",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="border-border border-b bg-card px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Button
              variant="ghost"
              type="button"
              className="-ml-2 mb-3 h-8 gap-2 px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
              返回模块管理
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <PackagePlus className="size-5" />
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
              {isEditMode ? "保存修改" : "创建模块"}
            </Button>
          </div>
        </div>
        {formError ? (
          <Alert variant="danger" className="mt-4">
            {formError}
          </Alert>
        ) : null}
      </div>

      <div className="px-6 py-5">
        <Card className="gap-0 rounded-lg border-border py-0 shadow-sm">
          <SectionHeader title="模块基础信息" description="模块唯一标识、关联应用和仓库地址" />
          <div className="space-y-5 p-4">
            <section>
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-primary" />
                <h2 className="font-semibold text-foreground text-sm">基础信息</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
                <Field label="模块 ID" className="xl:col-span-4">
                  <Input
                    readOnly={isEditMode}
                    aria-disabled={isEditMode}
                    className={
                      isEditMode ? "cursor-not-allowed bg-muted text-muted-foreground" : ""
                    }
                    placeholder="例如：module-profile"
                    {...moduleIdField}
                    onChange={(event) => {
                      moduleIdField.onChange(event);
                      clearFormError();
                    }}
                  />
                </Field>
                <Field label="模块名称" className="xl:col-span-4">
                  <Input
                    placeholder="例如：profile"
                    {...moduleNameField}
                    onChange={(event) => {
                      moduleNameField.onChange(event);
                      clearFormError();
                    }}
                  />
                </Field>
                <Field label="关联应用" className="xl:col-span-4">
                  <Controller
                    control={control}
                    name="applicationId"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={handleApplicationChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="选择应用" />
                        </SelectTrigger>
                        <SelectContent>
                          {applicationOptions.map((option) => (
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
                <Field label="模块类型" className="xl:col-span-4">
                  <Controller
                    control={control}
                    name="kind"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => handleKindChange(value as ModuleKind)}
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
                {selectedKind === "Feature" ? (
                  <Field label="通用模块" className="xl:col-span-4">
                    <Controller
                      control={control}
                      name="commonModuleId"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            clearFormError();
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="选择关联应用的通用模块" />
                          </SelectTrigger>
                          <SelectContent>
                            {commonModuleOptions.map((module) => (
                              <SelectItem key={module.id} value={module.id}>
                                {module.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {commonModuleOptions.length === 0 ? (
                      <p className="mt-2 text-warning text-xs">请先为当前应用创建通用模块</p>
                    ) : null}
                  </Field>
                ) : null}
              </div>
            </section>

            <section className="border-border border-t pt-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-success" />
                <h2 className="font-semibold text-foreground text-sm">仓库信息</h2>
              </div>
              <Field label="Git 仓库" className="max-w-3xl">
                <Controller
                  control={control}
                  name="repository"
                  render={({ field }) => (
                    <RepositoryPicker value={field.value} onChange={handleRepositoryChange} />
                  )}
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

function buildInitialForm(
  moduleRecord?: ModuleRecord,
  fallbackApplicationId = "",
): ModuleFormState {
  if (!moduleRecord) {
    return {
      ...defaultForm,
      applicationId: fallbackApplicationId,
    };
  }

  return {
    applicationId: moduleRecord.applicationId,
    commonModuleId: moduleRecord.commonModuleId,
    id: moduleRecord.id,
    kind: moduleRecord.kind,
    name: moduleRecord.name,
    owner: moduleRecord.owner,
    ownerAvatarUrl: moduleRecord.ownerAvatarUrl,
    ownerDepartmentIds: [],
    ownerEmail: moduleRecord.ownerEmail,
    ownerFeishuOpenId: "",
    ownerFeishuUnionId: "",
    ownerFeishuUserId: "",
    ownerUserId: moduleRecord.ownerUserId,
    repository: {
      cloneUrl: moduleRecord.repositoryCloneUrl,
      defaultBranch: moduleRecord.defaultBranch,
      fullName: moduleRecord.repositoryFullName,
      htmlUrl: moduleRecord.repositoryHtmlUrl,
      id: moduleRecord.repositoryId,
      installationId: moduleRecord.repositoryInstallationId,
      provider: moduleRecord.repositoryProvider,
      sshUrl: moduleRecord.repositorySshUrl,
    },
    repositoryKeyword: moduleRecord.repositoryFullName,
  };
}

function buildModuleInput(form: ModuleFormState): ModuleMutationInput {
  return {
    applicationId: form.applicationId,
    commonModuleId: form.kind === "Feature" ? form.commonModuleId.trim() : undefined,
    id: form.id.trim(),
    kind: form.kind,
    name: form.name.trim(),
    owner: form.owner.trim(),
    ownerAvatarUrl: form.ownerAvatarUrl.trim(),
    ownerDepartmentIds: form.ownerDepartmentIds,
    ownerEmail: form.ownerEmail.trim(),
    ownerFeishuOpenId: form.ownerFeishuOpenId.trim(),
    ownerFeishuUnionId: form.ownerFeishuUnionId.trim(),
    ownerFeishuUserId: form.ownerFeishuUserId.trim(),
    ownerUserId: form.ownerUserId.trim(),
    repository: form.repository ?? {
      cloneUrl: "",
      defaultBranch: "",
      fullName: "",
      htmlUrl: "",
      id: "",
      installationId: "",
      provider: "github",
      sshUrl: "",
    },
  };
}

function validateModuleInput(input: ModuleMutationInput) {
  if (!input.id) {
    return "请填写模块 ID";
  }

  if (!input.name) {
    return "请填写模块名称";
  }

  if (!input.applicationId) {
    return "请选择关联应用";
  }

  if (input.kind === "Feature" && !input.commonModuleId) {
    return "请选择当前应用的通用模块";
  }

  if (!input.owner || !input.ownerUserId) {
    return "请从搜索结果中选择负责人";
  }

  if (!input.repository.id || !input.repository.installationId || !input.repository.fullName) {
    return "请选择已授权仓库";
  }

  if (/\s/.test(input.id)) {
    return "模块 ID 不能包含空格";
  }

  return "";
}

function getOwnerUserId(user: FeishuUserSearchResult) {
  return user.id || user.openId || user.userId || user.unionId;
}

function RepositoryPicker({
  onChange,
  value,
}: {
  onChange: (value: ModuleRepositoryBinding | null) => void;
  value: ModuleRepositoryBinding | null;
}) {
  const [keyword, setKeyword] = useState(value?.fullName ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [repositories, setRepositories] = useState<ModuleRepositoryBinding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedFullName = value?.fullName ?? "";

  useEffect(() => {
    if (selectedFullName && selectedFullName !== keyword) {
      setKeyword(selectedFullName);
    }
  }, [keyword, selectedFullName]);

  useEffect(() => {
    const query = keyword.trim();
    if (!isOpen || selectedFullName === keyword || query.length < 2) {
      setRepositories([]);
      setIsLoading(false);
      setError("");
      return;
    }

    let disposed = false;
    setIsLoading(true);
    setError("");
    const handle = window.setTimeout(() => {
      void searchCodeSourceRepositories(query)
        .then((nextRepositories) => {
          if (!disposed) {
            setRepositories(nextRepositories);
          }
        })
        .catch((searchError) => {
          if (!disposed) {
            setRepositories([]);
            setError(
              searchError instanceof Error
                ? searchError.message
                : "仓库搜索失败，请先确认代码源已配置并安装",
            );
          }
        })
        .finally(() => {
          if (!disposed) {
            setIsLoading(false);
          }
        });
    }, 280);

    return () => {
      disposed = true;
      window.clearTimeout(handle);
    };
  }, [isOpen, keyword, selectedFullName]);

  const handleRepositorySelect = (repository: ModuleRepositoryBinding) => {
    onChange(repository);
    setKeyword(repository.fullName);
    setRepositories([]);
    setIsOpen(false);
    setError("");
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <GitFork className="size-4 shrink-0 text-muted-foreground" />
        <Input
          value={keyword}
          placeholder="搜索 GitHub 授权仓库，例如 org/repo"
          onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
          onChange={(event) => {
            const nextKeyword = event.target.value;
            setKeyword(nextKeyword);
            if (value && nextKeyword !== value.fullName) {
              onChange(null);
            }
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>
      {value ? (
        <div className="mt-2 rounded-md border border-border bg-muted px-3 py-2 text-muted-foreground text-xs">
          已绑定 {value.fullName}
          {value.defaultBranch ? ` · 默认分支 ${value.defaultBranch}` : ""}
        </div>
      ) : null}
      {isOpen && keyword.trim().length >= 2 && selectedFullName !== keyword ? (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-card py-1 shadow-lg">
          {isLoading ? (
            <div className="flex h-10 items-center gap-2 px-3 text-muted-foreground text-sm">
              <LoaderCircle className="size-4 animate-spin" />
              搜索中
            </div>
          ) : null}
          {!isLoading && error ? (
            <div className="px-3 py-2 text-destructive text-sm">{error}</div>
          ) : null}
          {!isLoading && !error && repositories.length === 0 ? (
            <div className="px-3 py-2 text-muted-foreground text-sm">未找到匹配仓库</div>
          ) : null}
          {repositories.map((repository) => (
            <Button
              key={`${repository.provider}-${repository.id}`}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start rounded-none px-3 py-2 text-left font-normal hover:bg-muted"
              onClick={() => handleRepositorySelect(repository)}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground text-sm">
                  {repository.fullName}
                </span>
                {repository.defaultBranch ? (
                  <span className="block truncate text-muted-foreground text-xs">
                    默认分支 {repository.defaultBranch}
                  </span>
                ) : null}
              </span>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ModuleFormLoading({ onBack }: { onBack: () => void }) {
  return (
    <div className="space-y-4 px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 h-8 gap-2 px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回模块管理
      </Button>
      <Card className="rounded-lg border-border p-6 shadow-none">
        <div className="space-y-3">
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-40 w-full animate-pulse rounded bg-muted" />
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
        className="-ml-2 h-8 gap-2 px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回模块管理
      </Button>
      <Card className="rounded-lg border-border bg-card p-6 shadow-none">
        <div className="font-semibold text-foreground text-sm">模块不存在</div>
        <p className="mt-1 text-muted-foreground text-sm">当前模块可能已被删除或路径无效。</p>
      </Card>
    </div>
  );
}

function ModuleCodeSourceRequired({
  onBack,
  onOpenCodeSources,
}: {
  onBack: () => void;
  onOpenCodeSources?: () => void;
}) {
  return (
    <>
      <div className="border-border border-b bg-card px-6 py-5">
        <Button
          variant="ghost"
          type="button"
          className="-ml-2 mb-3 h-8 gap-2 px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          返回模块管理
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <PackagePlus className="size-5" />
          </div>
          <div>
            <h1 className="font-semibold text-2xl text-foreground tracking-tight">新建模块</h1>
            <p className="mt-2 text-muted-foreground text-sm">
              登记新的模块仓库，并绑定归属应用与负责人
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <Card className="rounded-lg border-warning/40 bg-warning/10 p-5 text-warning shadow-none">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <GitFork className="size-4 shrink-0" />
                需要先安装代码源
              </div>
              <p className="mt-2 max-w-2xl text-warning text-sm leading-6">
                当前账号还没有可用的代码源授权。新建模块需要从已授权仓库中选择 Git
                仓库，请先到代码源管理安装 GitHub App。
              </p>
            </div>
            <Button
              type="button"
              className="shrink-0 bg-warning text-warning-foreground hover:bg-warning/90"
              onClick={onOpenCodeSources}
            >
              去代码源管理
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

function SectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex h-14 items-center gap-3 border-border border-b px-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Box className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="font-semibold text-foreground text-sm">{title}</div>
        <div className="truncate text-muted-foreground text-xs">{description}</div>
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
      <div className="mb-2 font-medium text-muted-foreground text-xs">{label}</div>
      {children}
    </div>
  );
}
