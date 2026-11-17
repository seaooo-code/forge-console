import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CloudUpload, LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { FeishuUserSearchResult } from "@/types/feishu";

import { storageEditQueryKey, storageSnapshotQueryKey } from "./api/storage-query-keys";
import { createStorageConfiguration, fetchStorageDetailSnapshot } from "./api/storage-snapshot";
import { StorageBasicInfoSection } from "./components/StorageBasicInfoSection";
import { StorageConnectionSection } from "./components/StorageConnectionSection";
import { StorageFormLoading, StorageFormNotFound } from "./components/StorageFormStates";
import { useStorageConnectionTest } from "./hooks";
import type { StorageFormState } from "./types";
import {
  buildInitialForm,
  buildStorageMutationInput,
  buildStorageTestSignature,
  updateExistingStorageConfiguration,
  validateStorageInput,
} from "./utils";

type StorageCreatePageProps = {
  mode?: "create" | "edit";
  onBack: () => void;
  onSaved?: (storageId: string) => void;
  storageId?: string;
};

export function StorageCreatePage({
  mode = "create",
  onBack,
  onSaved,
  storageId,
}: StorageCreatePageProps) {
  const queryClient = useQueryClient();
  const isEditMode = mode === "edit";
  const editStorageId = isEditMode ? storageId : undefined;
  const { data: snapshot, isFetching } = useQuery({
    queryFn: editStorageId ? () => fetchStorageDetailSnapshot(editStorageId) : skipToken,
    queryKey: storageEditQueryKey(editStorageId),
  });
  const storageConfig = storageId
    ? snapshot?.configurations.find((configuration) => configuration.id === storageId)
    : undefined;
  const initialForm = useMemo(
    () => buildInitialForm(isEditMode ? storageConfig : undefined),
    [isEditMode, storageConfig],
  );
  const {
    control,
    formState: { isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<StorageFormState>({
    defaultValues: initialForm,
  });
  const watchedForm = useWatch({ control, defaultValue: initialForm }) as Partial<StorageFormState>;
  const [formError, setFormError] = useState("");
  const {
    handleTestConfiguration,
    isCurrentTestPassed,
    isTesting,
    isTestStale,
    resetTestState,
    testedSignature,
  } = useStorageConnectionTest({
    getValues,
    isEditMode,
    setFormError,
    storageId,
    watchedForm,
  });

  useEffect(() => {
    reset(initialForm);
    setFormError("");
    resetTestState();
  }, [initialForm, reset, resetTestState]);

  if (isEditMode && isFetching && !storageConfig) {
    return <StorageFormLoading onBack={onBack} />;
  }

  if (isEditMode && !isFetching && !storageConfig) {
    return <StorageFormNotFound onBack={onBack} />;
  }

  const title = isEditMode ? "编辑存储配置" : "新增存储配置";
  const description = isEditMode
    ? "维护存储适配器连接参数和公开访问地址"
    : "配置存储适配器，用于 Bundle 上传、归档和下载分发";

  const handleFormSubmit = async (form: StorageFormState) => {
    const input = buildStorageMutationInput(form);
    const validationError = validateStorageInput(input, isEditMode);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!isCurrentTestPassed || testedSignature !== buildStorageTestSignature(input)) {
      setFormError("请先测试当前配置，测试通过后才能保存");
      return;
    }

    setFormError("");

    try {
      if (isEditMode && !storageId) {
        setFormError("存储配置路径无效");
        return;
      }

      const record = isEditMode
        ? await updateExistingStorageConfiguration(storageId, input)
        : await createStorageConfiguration(input);
      await queryClient.invalidateQueries({ queryKey: storageSnapshotQueryKey });
      onSaved?.(record.id);
    } catch (_error) {
      setFormError(isEditMode ? "保存存储配置失败，请稍后重试" : "创建存储配置失败，请稍后重试");
    }
  };

  const handleOwnerChange = (value: string) => {
    setValue("owner", value, { shouldDirty: true, shouldTouch: true });
    setValue("ownerAvatarUrl", "", { shouldDirty: true });
    setValue("ownerEmail", "", { shouldDirty: true });
    setValue("ownerFeishuOpenId", "", { shouldDirty: true });
    setValue("ownerFeishuUnionId", "", { shouldDirty: true });
    setValue("ownerFeishuUserId", "", { shouldDirty: true });
    setValue("ownerUserId", "", { shouldDirty: true });
  };

  const handleOwnerSelect = (user: FeishuUserSearchResult) => {
    setValue("owner", user.name, { shouldDirty: true, shouldTouch: true });
    setValue("ownerAvatarUrl", user.avatarUrl, { shouldDirty: true });
    setValue("ownerEmail", user.email, { shouldDirty: true });
    setValue("ownerFeishuOpenId", user.openId, { shouldDirty: true });
    setValue("ownerFeishuUnionId", user.unionId, { shouldDirty: true });
    setValue("ownerFeishuUserId", user.userId, { shouldDirty: true });
    setValue("ownerUserId", user.id || user.openId || user.userId || user.unionId, {
      shouldDirty: true,
    });
  };

  const primaryActionLabel = isCurrentTestPassed
    ? isEditMode
      ? "保存修改"
      : "保存配置"
    : isTestStale
      ? "重新测试"
      : "测试配置";

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
              返回存储管理
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CloudUpload className="size-5" />
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
              type={isCurrentTestPassed ? "submit" : "button"}
              className="bg-primary hover:bg-primary/90"
              disabled={isSubmitting || isTesting}
              onClick={isCurrentTestPassed ? undefined : () => void handleTestConfiguration()}
            >
              {isSubmitting || isTesting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              {primaryActionLabel}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        {formError ? <Alert variant="danger">{formError}</Alert> : null}
        {isCurrentTestPassed ? <Alert variant="success">当前配置测试通过，可以保存。</Alert> : null}
        {isTestStale ? <Alert variant="warning">字段已变更，请重新测试后再保存。</Alert> : null}

        <StorageBasicInfoSection
          control={control}
          onOwnerChange={handleOwnerChange}
          onOwnerSelect={handleOwnerSelect}
          register={register}
        />
        <StorageConnectionSection isEditMode={isEditMode} register={register} />
      </div>
    </form>
  );
}
