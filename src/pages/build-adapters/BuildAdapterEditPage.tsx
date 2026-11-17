import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, CirclePlay, RotateCw } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormSectionHeader } from "@/components/common/FormSectionHeader";
import { PageHeader } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/use-auth-store";

import {
  BuildAdapterAPIError,
  buildAdapterDetailQueryKey,
  buildAdaptersRootQueryKey,
  createBuildAdapter,
  fetchBuildAdapter,
  setBuildAdapterStatus,
  updateBuildAdapter,
} from "./api/build-adapters-snapshot";
import { BuildAdapterFilesSection } from "./components/BuildAdapterFilesSection";
import { BuildAdapterParametersSection } from "./components/BuildAdapterParametersSection";
import { BuildAdapterPreviewPanel } from "./components/BuildAdapterPreviewPanel";
import { BuildAdapterStatusBadge } from "./components/BuildAdapterStatusBadge";
import { BuildAdapterStatusDialog } from "./components/BuildAdapterStatusDialog";
import { BuildAdapterTemplateGuide } from "./components/BuildAdapterTemplateGuide";
import { TemplateEditor } from "./components/TemplateEditor";
import {
  dockerfileTemplatePlaceholder,
  maxBuildAdapterDescriptionLength,
  maxBuildAdapterNameLength,
} from "./constants";
import type { BuildAdapter, BuildAdapterFormState, BuildAdapterTemplateError } from "./types";
import {
  buildAdapterToForm,
  buildCreatePayload,
  buildUpdatePayload,
  formatDateTime,
  formatTemplateLocation,
  getSaveTemplateError,
  isDockerfileTemplate,
} from "./utils";

type BuildAdapterEditPageProps = {
  adapterId?: string;
  onBack: () => void;
  onCreated?: (adapterId: string) => void;
};

const conflictMessage = "适配器已被他人修改，请刷新";

export function BuildAdapterEditPage({ adapterId, onBack, onCreated }: BuildAdapterEditPageProps) {
  const queryClient = useQueryClient();
  const canManage = Boolean(
    useAuthStore((state) => state.session?.capabilities.canManageBuildAdapters),
  );
  const isEditMode = Boolean(adapterId);
  const readOnly = !canManage;
  const detailQuery = useQuery({
    queryFn: adapterId ? () => fetchBuildAdapter(adapterId) : skipToken,
    queryKey: buildAdapterDetailQueryKey(adapterId),
    // 刷新会覆盖正在编辑的表单，只在用户主动刷新或保存后更新。
    refetchOnWindowFocus: false,
    retry: false,
  });
  const latestAdapter = detailQuery.data;
  // 表单基于的已保存版本；和 latestAdapter 版本不一致说明有人在此期间修改过。
  const [baseAdapter, setBaseAdapter] = useState<BuildAdapter | null>(null);
  const form = useForm<BuildAdapterFormState>({ defaultValues: buildAdapterToForm() });
  const {
    control,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
    watch,
  } = form;
  const dockerfileTemplate = useWatch({ control, name: "dockerfileTemplate" });
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [isConflict, setIsConflict] = useState(false);
  const [saveTemplateError, setSaveTemplateError] = useState<BuildAdapterTemplateError | null>(
    null,
  );
  const [previewTemplateError, setPreviewTemplateError] =
    useState<BuildAdapterTemplateError | null>(null);
  const [statusTarget, setStatusTarget] = useState<BuildAdapter | null>(null);
  const [statusError, setStatusError] = useState("");
  const [isStatusPending, setIsStatusPending] = useState(false);
  const templateError = saveTemplateError ?? (canManage ? previewTemplateError : null);
  const isStale = Boolean(
    baseAdapter && latestAdapter && latestAdapter.version !== baseAdapter.version,
  );

  const applyAdapter = useCallback(
    (adapter: BuildAdapter) => {
      setBaseAdapter(adapter);
      reset(buildAdapterToForm(adapter));
      setIsConflict(false);
      setSaveTemplateError(null);
    },
    [reset],
  );

  useEffect(() => {
    if (!latestAdapter) {
      return;
    }
    // 首次加载，或别人改过但本地没有未保存的修改时，直接同步到最新版本。
    if (!baseAdapter || (latestAdapter.version !== baseAdapter.version && !isDirty)) {
      applyAdapter(latestAdapter);
    }
  }, [applyAdapter, baseAdapter, isDirty, latestAdapter]);

  // 保存失败的标注在用户继续编辑后失效。
  useEffect(() => {
    const subscription = watch(() => setSaveTemplateError(null));
    return () => subscription.unsubscribe();
  }, [watch]);

  const handlePreviewTemplateError = useCallback((error: BuildAdapterTemplateError | null) => {
    setPreviewTemplateError(error);
  }, []);

  const refreshLatest = async () => {
    setFormError("");
    setMessage("");
    const result = await detailQuery.refetch();
    if (result.data) {
      applyAdapter(result.data);
    }
  };

  const handleSaveError = (error: unknown) => {
    if (error instanceof BuildAdapterAPIError && error.status === 409) {
      setIsConflict(true);
      setFormError(conflictMessage);
      // 拉取最新版本，用于展示"已被修改为 vN"并支持刷新。
      if (adapterId) {
        void queryClient.invalidateQueries({ queryKey: buildAdapterDetailQueryKey(adapterId) });
      }
      return;
    }
    const templateSaveError = getSaveTemplateError(error);
    setSaveTemplateError(templateSaveError);
    setFormError(
      templateSaveError
        ? `保存失败：${formatTemplateLocation(templateSaveError)}，${templateSaveError.message}`
        : error instanceof Error
          ? error.message
          : "保存失败，请稍后重试",
    );
  };

  const onSubmit = async (values: BuildAdapterFormState) => {
    // 只读表单里按回车也会触发提交，这里直接忽略。
    if (readOnly) {
      return;
    }
    setFormError("");
    setMessage("");
    setIsConflict(false);

    if (!adapterId) {
      try {
        const created = await createBuildAdapter(buildCreatePayload(values));
        await queryClient.invalidateQueries({ queryKey: buildAdaptersRootQueryKey });
        onCreated?.(created.id);
      } catch (error) {
        handleSaveError(error);
      }
      return;
    }

    if (!baseAdapter) {
      return;
    }
    const payload = buildUpdatePayload(values, baseAdapter);
    if (Object.keys(payload).length === 0) {
      setMessage("没有需要保存的修改。");
      return;
    }

    try {
      // 带上表单基于的版本，服务端版本不一致时返回 409，避免覆盖别人在打开页面之后的修改。
      const updated = await updateBuildAdapter(adapterId, {
        ...payload,
        expectedVersion: baseAdapter.version,
      });
      queryClient.setQueryData(buildAdapterDetailQueryKey(adapterId), updated);
      applyAdapter(updated);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === buildAdaptersRootQueryKey[0] && query.queryKey[1] === "list",
      });
      setMessage(`已保存，当前版本 v${updated.version}。`);
    } catch (error) {
      handleSaveError(error);
    }
  };

  const handleToggleStatus = async (adapter: BuildAdapter) => {
    setIsStatusPending(true);
    setStatusError("");
    try {
      const updated = await setBuildAdapterStatus(
        adapter.id,
        adapter.status === "active" ? "disable" : "enable",
      );
      queryClient.setQueryData(buildAdapterDetailQueryKey(adapter.id), updated);
      // 启停不改模板内容，只同步基准版本，保留本地未保存的修改。
      setBaseAdapter(updated);
      await queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === buildAdaptersRootQueryKey[0] && query.queryKey[1] === "list",
      });
      setMessage(`适配器已${updated.status === "active" ? "启用" : "停用"}。`);
      setStatusTarget(null);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "操作失败，请稍后重试");
    } finally {
      setIsStatusPending(false);
    }
  };

  if (isEditMode && !baseAdapter) {
    return (
      <PageFrame onBack={onBack}>
        {detailQuery.isError ? (
          <Alert variant="danger">
            {detailQuery.error instanceof BuildAdapterAPIError && detailQuery.error.status === 404
              ? "构建适配器不存在或已被删除。"
              : detailQuery.error instanceof BuildAdapterAPIError &&
                  detailQuery.error.status === 403
                ? "当前账号无权查看构建适配器，需要平台管理员，或任一应用的 Owner。"
                : detailQuery.error instanceof Error
                  ? detailQuery.error.message
                  : "读取构建适配器失败"}
          </Alert>
        ) : (
          <>
            <Card className="h-48 animate-pulse rounded-lg bg-card" />
            <Card className="h-96 animate-pulse rounded-lg bg-card" />
          </>
        )}
      </PageFrame>
    );
  }

  if (!isEditMode && !canManage) {
    return (
      <PageFrame onBack={onBack}>
        <Alert variant="warning">新建构建适配器需要平台管理员权限。</Alert>
      </PageFrame>
    );
  }

  const title = isEditMode ? `${readOnly ? "查看" : "编辑"}构建适配器` : "新建构建适配器";

  return (
    <>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        <PageHeader
          backLabel="构建适配器"
          onBack={onBack}
          title={
            <span className="flex flex-wrap items-center gap-2.5">
              {isEditMode && baseAdapter ? baseAdapter.name || title : title}
              {baseAdapter ? (
                <>
                  <BuildAdapterStatusBadge status={baseAdapter.status} />
                  <Badge variant="neutral" className="font-mono">
                    v{baseAdapter.version}
                  </Badge>
                </>
              ) : null}
            </span>
          }
          description={
            baseAdapter
              ? `被 ${baseAdapter.moduleCount} 个模块引用 · ${baseAdapter.updatedBy?.name || baseAdapter.updatedByUserId || "-"} 更新于 ${formatDateTime(baseAdapter.updatedAt)}`
              : "定义 Dockerfile 模板、辅助文件和参数，保存后模块即可选用"
          }
          actions={
            <>
              {baseAdapter && canManage ? (
                <Button
                  type="button"
                  variant={baseAdapter.status === "active" ? "danger-outline" : "outline"}
                  onClick={() => {
                    setStatusError("");
                    setStatusTarget(baseAdapter);
                  }}
                >
                  {baseAdapter.status === "active" ? <Ban /> : <CirclePlay />}
                  {baseAdapter.status === "active" ? "停用" : "启用"}
                </Button>
              ) : null}
              <Button variant="outline" type="button" onClick={onBack}>
                {readOnly ? "返回" : "取消"}
              </Button>
              {readOnly ? null : (
                <Button type="submit" loading={isSubmitting}>
                  {isEditMode ? "保存修改" : "创建适配器"}
                </Button>
              )}
            </>
          }
        />

        <div className="space-y-2 empty:hidden">
          {readOnly ? (
            <Alert variant="info">
              当前账号只能查看已保存的内容，编辑和渲染预览需要平台管理员权限。
            </Alert>
          ) : null}
          {isStale && !isConflict ? (
            <Alert variant="warning">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  适配器已被他人修改为 v{latestAdapter?.version}，你的修改基于 v
                  {baseAdapter?.version}，请刷新后再编辑。
                </span>
                <RefreshButton onClick={() => void refreshLatest()} />
              </div>
            </Alert>
          ) : null}
          {formError ? (
            <Alert variant="danger">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="break-all">{formError}</span>
                {isConflict ? <RefreshButton onClick={() => void refreshLatest()} /> : null}
              </div>
            </Alert>
          ) : null}
          {message ? <Alert variant="success">{message}</Alert> : null}
        </div>

        <div className="grid gap-4 xl:grid-cols-5">
          <div className="min-w-0 space-y-4 xl:col-span-3">
            <Card className="gap-0 rounded-lg p-0">
              <FormSectionHeader title="基础信息" description="名称会展示在模块的构建方式选择中" />
              <div className="grid gap-4 px-5 py-4">
                <FieldBlock label="名称" required error={errors.name?.message}>
                  <Input
                    {...register("name", {
                      maxLength: {
                        message: `名称不能超过 ${maxBuildAdapterNameLength} 字`,
                        value: maxBuildAdapterNameLength,
                      },
                      validate: (value) => (value.trim() ? true : "请填写名称"),
                    })}
                    readOnly={readOnly}
                    placeholder="例如：RN Bundle 打包"
                    aria-invalid={errors.name ? true : undefined}
                  />
                </FieldBlock>
                <FieldBlock label="描述" error={errors.description?.message}>
                  <Textarea
                    {...register("description", {
                      maxLength: {
                        message: `描述不能超过 ${maxBuildAdapterDescriptionLength} 字`,
                        value: maxBuildAdapterDescriptionLength,
                      },
                    })}
                    readOnly={readOnly}
                    rows={2}
                    placeholder="适用的仓库类型、打包工具链和注意事项"
                    aria-invalid={errors.description ? true : undefined}
                  />
                </FieldBlock>
              </div>
            </Card>

            <Card className="gap-0 rounded-lg p-0">
              <FormSectionHeader
                title="Dockerfile 模板"
                description="渲染后在仓库之外生成 Dockerfile，以模块的构建上下文执行 docker build；产物仍需导出 dist/forge.json 与 dist/{platform}/。"
              />
              <div className="space-y-1 px-5 py-4">
                <TemplateEditor
                  error={
                    templateError && isDockerfileTemplate(templateError.template)
                      ? templateError
                      : null
                  }
                  field={register("dockerfileTemplate", {
                    validate: (value) => (value.trim() ? true : "请填写 Dockerfile 模板"),
                  })}
                  minRows={12}
                  placeholder={dockerfileTemplatePlaceholder}
                  readOnly={readOnly}
                  value={dockerfileTemplate ?? ""}
                />
                {errors.dockerfileTemplate?.message ? (
                  <p className="text-destructive text-xs">{errors.dockerfileTemplate.message}</p>
                ) : null}
              </div>
            </Card>

            <BuildAdapterFilesSection
              control={control}
              errors={errors.files}
              readOnly={readOnly}
              register={register}
              templateError={templateError}
            />

            <BuildAdapterParametersSection
              control={control}
              errors={errors.parameters}
              readOnly={readOnly}
              register={register}
            />
          </div>

          <div className="min-w-0 space-y-4 xl:col-span-2">
            {canManage ? (
              <BuildAdapterPreviewPanel
                control={control}
                onTemplateErrorChange={handlePreviewTemplateError}
              />
            ) : null}
            <BuildAdapterTemplateGuide />
          </div>
        </div>
      </form>

      <BuildAdapterStatusDialog
        adapter={statusTarget}
        error={statusError}
        isPending={isStatusPending}
        onCancel={() => {
          if (!isStatusPending) {
            setStatusTarget(null);
            setStatusError("");
          }
        }}
        onConfirm={(adapter) => void handleToggleStatus(adapter)}
      />
    </>
  );
}

function PageFrame({ children, onBack }: { children: ReactNode; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader backLabel="构建适配器" onBack={onBack} title="构建适配器" />
      {children}
    </div>
  );
}

function RefreshButton({ onClick }: { onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" className="h-7" onClick={onClick}>
      <RotateCw className="size-3.5" />
      刷新（丢弃本地修改）
    </Button>
  );
}

function FieldBlock({
  children,
  error,
  label,
  required = false,
}: {
  children: ReactNode;
  error?: string;
  label: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <span className="font-medium text-foreground text-sm">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
