import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { type AssignableUser, resolveAssignableUser } from "@/api/feishu-user-search";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "@/components/common/Drawer";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { storageEditQueryKey, storageSnapshotQueryKey } from "./api/storage-query-keys";
import { createStorageConfiguration, fetchStorageDetailSnapshot } from "./api/storage-snapshot";
import { StorageBasicInfoSection } from "./components/StorageBasicInfoSection";
import { StorageConnectionSection } from "./components/StorageConnectionSection";
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

  if (isEditMode && !storageConfig) {
    return (
      <>
        <DrawerHeader title="编辑存储配置" onClose={onBack} />
        <DrawerBody>
          {isFetching ? (
            <div className="h-80 animate-pulse rounded-xl bg-muted" />
          ) : (
            <p className="m-0 text-muted-foreground text-sm">
              没有找到这份存储配置，它可能已被删除或路径无效。
            </p>
          )}
        </DrawerBody>
      </>
    );
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
    setValue("ownerUserId", "", { shouldDirty: true });
  };

  const handleOwnerSelect = async (user: AssignableUser) => {
    // 通讯录里的人先换成当前租户的 Forge 用户，表单只提交 ownerUserId。
    const resolved = await resolveAssignableUser(user);
    setValue("owner", resolved.name, { shouldDirty: true, shouldTouch: true });
    setValue("ownerAvatarUrl", resolved.avatarUrl, { shouldDirty: true });
    setValue("ownerEmail", resolved.email, { shouldDirty: true });
    setValue("ownerUserId", resolved.id, { shouldDirty: true });
  };

  const primaryActionLabel = isCurrentTestPassed
    ? isEditMode
      ? "保存修改"
      : "保存配置"
    : isTestStale
      ? "重新测试"
      : "测试配置";

  return (
    <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(handleFormSubmit)}>
      <DrawerHeader title={title} description={description} onClose={onBack} />
      <DrawerBody className="space-y-5">
        {formError ? <Alert variant="danger">{formError}</Alert> : null}
        {isCurrentTestPassed ? <Alert variant="success">当前配置测试通过，可以保存。</Alert> : null}
        {isTestStale ? <Alert variant="warning">字段已变更，请重新测试后再保存。</Alert> : null}

        <StorageBasicInfoSection
          control={control}
          onOwnerChange={handleOwnerChange}
          onOwnerSelect={handleOwnerSelect}
          register={register}
        />
        <StorageConnectionSection control={control} isEditMode={isEditMode} register={register} />
      </DrawerBody>
      <DrawerFooter>
        <Button variant="outline" type="button" onClick={onBack}>
          取消
        </Button>
        <Button
          type={isCurrentTestPassed ? "submit" : "button"}
          loading={isSubmitting || isTesting}
          onClick={isCurrentTestPassed ? undefined : () => void handleTestConfiguration()}
        >
          {primaryActionLabel}
        </Button>
      </DrawerFooter>
    </form>
  );
}

/** 新建、编辑存储配置的右侧抽屉，叠在存储列表之上。 */
export function StorageFormDrawer(props: StorageCreatePageProps) {
  return (
    <Drawer isOpen onClose={props.onBack} className="max-w-2xl">
      <StorageCreatePage {...props} />
    </Drawer>
  );
}
