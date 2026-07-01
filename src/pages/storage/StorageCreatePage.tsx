import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CircleHelp, CloudUpload, LoaderCircle } from "lucide-react";
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
import type { StorageAdapter, StorageConfigRecord, StorageStatus } from "@/types/storage";
import { storageEditQueryKey, storageSnapshotQueryKey } from "./api/storage-query-keys";
import {
  createStorageConfiguration,
  fetchStorageDetailSnapshot,
  testStorageConfiguration,
  updateStorageConfiguration,
} from "./api/storage-snapshot";
import { defaultForm, storageAdapterOptions } from "./constants";
import type { StorageFormState, StorageMutationInput } from "./types";

type StorageCreatePageProps = {
  mode?: "create" | "edit";
  onBack: () => void;
  onSaved?: (storageId: string) => void;
  storageId?: string;
};

type StorageTestStatus = "idle" | "testing" | "passed" | "failed";

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
  const [testStatus, setTestStatus] = useState<StorageTestStatus>("idle");
  const [testedSignature, setTestedSignature] = useState("");
  const currentSignature = useMemo(
    () => buildStorageTestSignature(buildStorageMutationInput(normalizeStorageForm(watchedForm))),
    [watchedForm],
  );
  const isTesting = testStatus === "testing";
  const isCurrentTestPassed = testStatus === "passed" && testedSignature === currentSignature;
  const isTestStale = testStatus === "passed" && testedSignature !== currentSignature;

  useEffect(() => {
    reset(initialForm);
    setFormError("");
    setTestStatus("idle");
    setTestedSignature("");
  }, [initialForm, reset]);

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

  const handleTestConfiguration = async () => {
    const input = buildStorageMutationInput(getValues());
    const validationError = validateStorageInput(input, isEditMode);
    if (validationError) {
      setFormError(validationError);
      setTestStatus("idle");
      setTestedSignature("");
      return;
    }

    setFormError("");
    setTestStatus("testing");

    try {
      await testStorageConfiguration(input, storageId);
      setTestStatus("passed");
      setTestedSignature(buildStorageTestSignature(input));
    } catch (_error) {
      setTestStatus("failed");
      setTestedSignature("");
      setFormError("测试存储配置失败，请检查连接参数");
    }
  };

  const handleOwnerChange = (value: string) => {
    setValue("owner", value, { shouldDirty: true, shouldTouch: true });
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
              返回存储管理
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
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
              onClick={isCurrentTestPassed ? undefined : handleTestConfiguration}
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

        <Card className="rounded-lg border-border bg-card p-0 shadow-none">
          <FormSectionHeader title="基础信息" description="命名配置并选择对象存储适配器" />
          <div className="grid gap-4 px-5 pb-5 xl:grid-cols-3">
            <Field label="配置名称" required>
              <Input placeholder="例如：小米汽车-生产OSS" {...register("name")} />
            </Field>
            <Field label="适配器" required>
              <Controller
                control={control}
                name="adapter"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as StorageAdapter)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {storageAdapterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="状态">
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value as StorageStatus)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="正常">正常</SelectItem>
                      <SelectItem value="异常">异常</SelectItem>
                      <SelectItem value="已停用">已停用</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field label="负责人">
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
                  />
                )}
              />
            </Field>
          </div>
        </Card>

        <Card className="rounded-lg border-border bg-card p-0 shadow-none">
          <FormSectionHeader title="接入配置" description="S3 兼容存储连接参数和公开访问地址" />
          <div className="grid gap-4 px-5 pb-5 xl:grid-cols-2">
            <Field label="Bucket" required>
              <Input placeholder="xiaomi-auto-rn-prod" {...register("bucket")} />
            </Field>
            <Field label={<RegionLabel />}>
              <Input placeholder="可选，例如 cn-beijing / ap-guangzhou" {...register("region")} />
            </Field>
            <Field label="Endpoint" required>
              <Input placeholder="oss-cn-beijing.aliyuncs.com" {...register("endpoint")} />
            </Field>
            <Field label="publicBaseURL">
              <Input placeholder="https://cdn.example.com/rn/prod" {...register("publicBaseUrl")} />
            </Field>
            <Field label="Access Key ID" required={!isEditMode}>
              <Input
                placeholder={isEditMode ? "留空表示不更新" : "只保存到服务端密钥托管"}
                {...register("accessKeyId")}
              />
            </Field>
            <Field label="Secret Access Key" required={!isEditMode}>
              <Input
                type="password"
                placeholder={isEditMode ? "留空表示不更新" : "创建后不会明文展示"}
                {...register("secretAccessKey")}
              />
            </Field>
          </div>
        </Card>
      </div>
    </form>
  );
}

async function updateExistingStorageConfiguration(
  storageId: string | undefined,
  input: StorageMutationInput,
) {
  if (!storageId) {
    throw new Error("Storage id is required");
  }

  return updateStorageConfiguration(storageId, input);
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
      <span className="font-medium text-foreground text-sm">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      {children}
    </div>
  );
}

function RegionLabel() {
  return (
    <span className="inline-flex items-center gap-1">
      Region
      <span className="font-normal text-muted-foreground text-xs">可选</span>
      <span className="group relative inline-flex">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className="size-5 rounded-full p-0 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Region 配置说明"
        >
          <CircleHelp className="size-3.5" />
        </Button>
        <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-80 -translate-x-1/2 rounded-md border border-border bg-card px-3 py-2 text-left font-normal text-muted-foreground text-xs leading-5 shadow-lg group-focus-within:block group-hover:block">
          AWS S3、阿里云 OSS、腾讯云 COS、华为云 OBS 通常需要填写 Region；MinIO、Ceph RGW
          等私有部署可按服务端配置填写或留空。
        </span>
      </span>
    </span>
  );
}

function FormSectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="border-border border-b px-5 py-4">
      <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      <p className="mt-1 text-muted-foreground text-xs">{description}</p>
    </div>
  );
}

function StorageFormLoading({ onBack }: { onBack: () => void }) {
  return (
    <>
      <div className="border-border border-b bg-card px-6 py-5">
        <Button
          variant="ghost"
          type="button"
          className="-ml-2 mb-3 h-8 gap-2 px-2 text-muted-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          返回存储管理
        </Button>
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="space-y-4 px-6 py-5">
        <Card className="h-48 animate-pulse rounded-lg border-border bg-card shadow-none" />
        <Card className="h-64 animate-pulse rounded-lg border-border bg-card shadow-none" />
      </div>
    </>
  );
}

function StorageFormNotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="border-border border-b bg-card px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 mb-3 h-8 gap-2 px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回存储管理
      </Button>
      <h1 className="font-semibold text-2xl text-foreground tracking-tight">存储配置不存在</h1>
      <p className="mt-2 text-muted-foreground text-sm">当前配置可能已被删除或路径无效。</p>
    </div>
  );
}

function buildInitialForm(storage?: StorageConfigRecord): StorageFormState {
  if (!storage) {
    return defaultForm;
  }

  return {
    accessKeyId: "",
    adapter: storage.adapter,
    bucket: storage.bucket,
    endpoint: storage.endpoint,
    name: storage.name,
    owner: storage.owner,
    publicBaseUrl: storage.publicBaseUrl,
    region: storage.region,
    secretAccessKey: "",
    status: storage.status,
  };
}

function normalizeStorageForm(form: Partial<StorageFormState>): StorageFormState {
  return {
    accessKeyId: form.accessKeyId ?? "",
    adapter: form.adapter ?? "S3",
    bucket: form.bucket ?? "",
    endpoint: form.endpoint ?? "",
    name: form.name ?? "",
    owner: form.owner ?? "",
    publicBaseUrl: form.publicBaseUrl ?? "",
    region: form.region ?? "",
    secretAccessKey: form.secretAccessKey ?? "",
    status: form.status ?? "正常",
  };
}

function validateStorageInput(input: StorageMutationInput, isEditMode: boolean) {
  if (!input.name || !input.bucket || !input.endpoint) {
    return isEditMode
      ? "请完整填写配置名称、Bucket 与 Endpoint"
      : "请完整填写配置名称、Bucket、Endpoint 与访问密钥";
  }

  if (!isEditMode && (!input.accessKeyId || !input.secretAccessKey)) {
    return "请完整填写配置名称、Bucket、Endpoint 与访问密钥";
  }

  return "";
}

function buildStorageTestSignature(input: StorageMutationInput) {
  return JSON.stringify(input);
}

function buildStorageMutationInput(form: StorageFormState): StorageMutationInput {
  return {
    accessKeyId: form.accessKeyId.trim(),
    adapter: form.adapter,
    bucket: form.bucket.trim(),
    endpoint: form.endpoint.trim(),
    name: form.name.trim(),
    owner: form.owner.trim(),
    publicBaseUrl: form.publicBaseUrl.trim(),
    region: form.region.trim(),
    secretAccessKey: form.secretAccessKey.trim(),
    status: form.status,
  };
}
