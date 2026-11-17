import { useQueryClient } from "@tanstack/react-query";
import { useWatch } from "react-hook-form";
import { FormActions, PageHeader } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { applicationsRootQueryKey } from "@/pages/applications";
import type { FeishuUserSearchResult } from "@/types/feishu";

import { createModule, modulesRootQueryKey } from "./api/modules-snapshot";
import { ModuleBuildConfigFields } from "./components/ModuleBuildConfigFields";
import { ModuleFormFields } from "./components/ModuleFormFields";
import {
  ModuleCodeSourceRequired,
  ModuleFormLoading,
  ModuleFormNotFound,
} from "./components/ModuleFormStatus";
import { useModuleBuildAdapters, useModuleFormData } from "./hooks";
import type { ModuleFormState, ModuleKind, ModuleRepositorySelection } from "./types";
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
    commonModuleOptions,
    connections,
    environmentOptions,
    form,
    formError,
    hasActiveConnection,
    isApplicationsFetching,
    isConnectionsFetching,
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
  const adaptersQuery = useModuleBuildAdapters();
  const selectedConnectionId = useWatch({ control, name: "connectionId" });
  const selectedConnection = connections.find(
    (connection) => connection.id === selectedConnectionId,
  );

  if (
    (isEditMode && isModuleFetching && !moduleRecord) ||
    (isApplicationsFetching && !applicationSnapshot)
  ) {
    return <ModuleFormLoading onBack={onBack} />;
  }

  if (isConnectionsFetching && connections.length === 0) {
    return <ModuleFormLoading onBack={onBack} />;
  }

  if (!isEditMode && !hasActiveConnection) {
    return <ModuleCodeSourceRequired onBack={onBack} onOpenCodeSources={onOpenCodeSources} />;
  }

  if (isEditMode && !isModuleFetching && !moduleRecord) {
    return <ModuleFormNotFound onBack={onBack} />;
  }

  const title = isEditMode ? "编辑模块" : "新建模块";
  const description = isEditMode
    ? "维护模块仓库、构建配置、负责人和模块关系"
    : "登记新的模块仓库，配置构建方式，并绑定归属应用与负责人";
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

  const handleConnectionChange = (value: string) => {
    clearFormError();
    setValue("connectionId", value, { shouldDirty: true, shouldTouch: true });
    setValue("repository", null, { shouldDirty: true, shouldTouch: true });
  };

  const handleRepositoryChange = (repository: ModuleRepositorySelection | null) => {
    clearFormError();
    setValue("repository", repository, { shouldDirty: true, shouldTouch: true });
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
    const selectedAdapter = adaptersQuery.data?.find(
      (adapter) => adapter.id === form.buildConfig.buildAdapterId,
    );
    // 读不到适配器列表时（无权限）保持模块原有的适配器参数，不做按定义过滤。
    if (
      form.buildConfig.buildMode === "adapter" &&
      !selectedAdapter &&
      form.buildConfig.buildAdapterId !== moduleRecord?.buildConfig.buildAdapterId
    ) {
      setFormError("请选择构建适配器");
      return;
    }
    const input = buildModuleInput(form, selectedAdapter);
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
    <form className="flex flex-col gap-5" onSubmit={handleSubmit(handleFormSubmit)}>
      <PageHeader backLabel="模块" onBack={onBack} title={title} description={description} />

      {formError ? <Alert variant="danger">{formError}</Alert> : null}

      <section className="rounded-xl bg-card shadow-edge">
        <ModuleFormFields
          applicationOptions={applicationOptions}
          clearFormError={clearFormError}
          commonModuleOptions={commonModuleOptions}
          connections={connections}
          control={control}
          isEditMode={isEditMode}
          moduleIdField={moduleIdField}
          moduleNameField={moduleNameField}
          onApplicationChange={handleApplicationChange}
          onConnectionChange={handleConnectionChange}
          onKindChange={handleKindChange}
          onOwnerChange={handleOwnerChange}
          onOwnerSelect={handleOwnerSelect}
          onRepositoryChange={handleRepositoryChange}
          selectedConnection={selectedConnection}
          selectedKind={selectedKind}
        />
        <div className="px-4 pb-5">
          <ModuleBuildConfigFields
            adapters={adaptersQuery.data}
            adaptersError={adaptersQuery.error}
            clearFormError={clearFormError}
            control={control}
            currentAdapterId={moduleRecord?.buildConfig.buildAdapterId ?? ""}
            currentAdapterName={moduleRecord?.buildConfig.buildAdapterName ?? ""}
            environmentOptions={environmentOptions}
            isAdaptersLoading={adaptersQuery.isPending}
            moduleId={isEditMode ? moduleRecord?.id : undefined}
            register={register}
          />
        </div>
      </section>

      <FormActions
        className="mt-0"
        secondary={
          <Button variant="outline" type="button" onClick={onBack}>
            取消
          </Button>
        }
        primary={
          <Button type="submit" loading={isSubmitting}>
            {isEditMode ? "保存修改" : "创建模块"}
          </Button>
        }
      />
    </form>
  );
}
