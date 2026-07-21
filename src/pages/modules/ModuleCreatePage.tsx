import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Box, LoaderCircle, PackagePlus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { applicationsRootQueryKey } from "@/pages/applications";
import type { FeishuUserSearchResult } from "@/types/feishu";

import { createModule, modulesRootQueryKey } from "./api/modules-snapshot";
import { ModuleFormFields } from "./components/ModuleFormFields";
import {
  ModuleCodeSourceRequired,
  ModuleFormLoading,
  ModuleFormNotFound,
} from "./components/ModuleFormStatus";
import { useModuleFormData } from "./hooks";
import type { ModuleFormState, ModuleKind, ModuleRepositoryBinding } from "./types";
import {
  buildModuleInput,
  getOwnerUserId,
  updateExistingModule,
  validateModuleInput,
} from "./utils";

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
  const {
    applicationOptions,
    applicationSnapshot,
    codeSourceSnapshot,
    commonModuleOptions,
    form,
    formError,
    hasInstalledCodeSource,
    isApplicationsFetching,
    isCodeSourcesFetching,
    isEditMode,
    isModuleFetching,
    moduleRecord,
    selectedKind,
    setFormError,
  } = useModuleFormData(mode, moduleId);
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
    register,
    setValue,
  } = form;

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
          <ModuleFormFields
            applicationOptions={applicationOptions}
            clearFormError={clearFormError}
            commonModuleOptions={commonModuleOptions}
            control={control}
            isEditMode={isEditMode}
            moduleIdField={moduleIdField}
            moduleNameField={moduleNameField}
            onApplicationChange={handleApplicationChange}
            onKindChange={handleKindChange}
            onOwnerChange={handleOwnerChange}
            onOwnerSelect={handleOwnerSelect}
            onRepositoryChange={handleRepositoryChange}
            selectedKind={selectedKind}
          />
        </Card>
      </div>
    </form>
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
