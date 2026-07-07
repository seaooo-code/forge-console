import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import {
  Activity,
  Circle,
  Clock3,
  GitBranch,
  LoaderCircle,
  PackageCheck,
  Plus,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { fetchModulesSnapshot, modulesRootQueryKey } from "@/api/modules";
import { Modal, ModalFooter, ModalHeader } from "@/components/common/Modal";
import { DataTable, FilterBar, KpiCard, PageHeader, TablePagination } from "@/components/layout";
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
import { cn } from "@/lib/utils";
import { environmentsSnapshotQueryKey, fetchEnvironmentsSnapshot } from "@/pages/environments";
import {
  fetchReleaseRecordsSnapshot,
  releaseRecordsSnapshotQueryKey,
} from "@/pages/release-records";
import { useAuthStore } from "@/store/use-auth-store";

import {
  buildsSnapshotQueryKey,
  createBuild,
  createBuildRelease,
  fetchBuildsSnapshot,
} from "./api/builds-snapshot";
import { buildStatusClass, buildTriggerLabels } from "./constants";
import type {
  BuildCreateFormState,
  BuildReleaseFormState,
  BuildReleaseGrayStrategy,
  BuildReleaseType,
  BuildRunRecord,
  BuildRunStatus,
  BuildTriggerType,
} from "./types";

const PAGE_SIZE = 20;

type BuildsPageProps = {
  onOpenBuild: (buildId: string) => void;
};

type BuildModuleOption = {
  applicationName: string;
  defaultBranch: string;
  label: string;
  repositoryFullName: string;
  value: string;
};

type BuildEnvironmentOption = {
  label: string;
  value: string;
};

type ActiveFullReleaseTarget = {
  build?: BuildRunRecord;
  buildId: string;
};

export function BuildsPage({ onOpenBuild }: BuildsPageProps) {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const canCreateBuild = Boolean(session?.capabilities.canCreateBuild);
  const canCreateRelease = Boolean(session?.capabilities.canCreateRelease);
  const {
    data: snapshot,
    isFetching,
    refetch,
  } = useQuery({
    queryFn: fetchBuildsSnapshot,
    queryKey: buildsSnapshotQueryKey,
  });
  const { data: modulesSnapshot, isFetching: isModulesFetching } = useQuery({
    queryFn: () => fetchModulesSnapshot(),
    queryKey: modulesRootQueryKey,
  });
  const { data: environmentSnapshot, isFetching: isEnvironmentsFetching } = useQuery({
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });
  const { data: releaseRecordsSnapshot } = useQuery({
    queryFn: () => fetchReleaseRecordsSnapshot(),
    queryKey: releaseRecordsSnapshotQueryKey,
  });
  const [isCreateBuildDialogOpen, setIsCreateBuildDialogOpen] = useState(false);
  const [buildError, setBuildError] = useState("");
  const [buildSuccess, setBuildSuccess] = useState("");
  const [releaseBuild, setReleaseBuild] = useState<BuildRunRecord | null>(null);
  const [releaseError, setReleaseError] = useState("");
  const [releaseSuccess, setReleaseSuccess] = useState("");
  const [page, setPage] = useState(1);
  const buildsById = useMemo(
    () => new Map(snapshot?.builds.map((build) => [build.id, build]) ?? []),
    [snapshot],
  );
  const activeFullReleaseByTarget = useMemo(() => {
    const releases = new Map<string, ActiveFullReleaseTarget>();

    for (const record of releaseRecordsSnapshot?.records ?? []) {
      if (record.status !== "active" || record.releaseType !== "full") {
        continue;
      }

      releases.set(buildReleaseTargetKey(record.moduleId, record.environment), {
        build: buildsById.get(record.buildRecordId),
        buildId: record.buildRecordId,
      });
    }

    return releases;
  }, [buildsById, releaseRecordsSnapshot]);
  const moduleOptions = useMemo(
    () =>
      modulesSnapshot?.modules.map((module) => ({
        applicationName: module.applicationName,
        defaultBranch: module.defaultBranch,
        label: module.name,
        repositoryFullName: module.repositoryFullName || module.repository,
        value: module.id,
      })) ?? [],
    [modulesSnapshot],
  );
  const environmentOptions = useMemo(
    () =>
      environmentSnapshot?.environments.map((environment) => ({
        label: environment.name,
        value: environment.id,
      })) ?? [],
    [environmentSnapshot],
  );
  const openReleaseDialog = useCallback((build: BuildRunRecord) => {
    setReleaseBuild(build);
    setReleaseError("");
    setReleaseSuccess("");
  }, []);
  const closeReleaseDialog = useCallback(() => {
    setReleaseBuild(null);
    setReleaseError("");
  }, []);
  const stats = useMemo(
    () =>
      snapshot
        ? [
            {
              detail: "全部构建记录",
              icon: Activity,
              id: "total",
              label: "总构建",
              tone: "info" as const,
              value: snapshot.summary.total,
            },
            {
              detail: "正在执行",
              icon: LoaderCircle,
              id: "running",
              label: "构建中",
              tone: "info" as const,
              value: snapshot.summary.running,
            },
            {
              detail: "产物可发布",
              icon: PackageCheck,
              id: "success",
              label: "成功",
              tone: "success" as const,
              value: snapshot.summary.success,
            },
            {
              detail: "需要排查",
              icon: Circle,
              id: "failed",
              label: "失败",
              tone: "destructive" as const,
              value: snapshot.summary.failed,
            },
            {
              detail: "等待执行",
              icon: Clock3,
              id: "queued",
              label: "排队中",
              tone: "warning" as const,
              value: snapshot.summary.queued,
            },
          ]
        : [],
    [snapshot],
  );
  const columnDefs = useMemo<ColDef<BuildRunRecord>[]>(
    () => [
      {
        cellRenderer: BuildIDCell,
        field: "id",
        flex: 0.45,
        headerName: "ID",
        minWidth: 96,
      },
      {
        cellRenderer: BuildCell,
        field: "createdAt",
        flex: 1,
        headerName: "构建时间",
        minWidth: 176,
      },
      {
        field: "application",
        flex: 0.8,
        headerName: "应用",
        minWidth: 120,
      },
      {
        field: "module",
        flex: 0.75,
        headerName: "模块",
        minWidth: 110,
      },
      {
        cellRenderer: BranchCell,
        field: "branch",
        flex: 1.3,
        headerName: "分支",
        minWidth: 220,
      },
      {
        field: "version",
        flex: 0.85,
        headerName: "环境",
        minWidth: 130,
      },
      {
        cellRenderer: TriggerCell,
        field: "triggerType",
        flex: 0.75,
        headerName: "触发方式",
        minWidth: 110,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.65,
        headerName: "状态",
        minWidth: 92,
      },
      {
        field: "operator",
        flex: 0.7,
        headerName: "触发人",
        minWidth: 100,
      },
      {
        field: "duration",
        flex: 0.55,
        headerName: "耗时",
        minWidth: 82,
      },
      {
        cellRenderer: (params: ICellRendererParams<BuildRunRecord>) => (
          <ActionsCell
            canCreateRelease={canCreateRelease}
            data={params.data}
            onPublish={openReleaseDialog}
          />
        ),
        colId: "actions",
        flex: 0.65,
        headerName: "操作",
        minWidth: 92,
        sortable: false,
      },
    ],
    [canCreateRelease, openReleaseDialog],
  );

  if (!snapshot) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="构建管理"
          description="汇总所有模块构建执行，支持手动新增构建并跟踪流水线触发结果"
        />

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {stats.map((item) => (
            <KpiCard
              key={item.id}
              icon={item.icon}
              label={item.label}
              value={item.value}
              detail={item.detail}
              tone={item.tone}
            />
          ))}
        </section>

        <FilterBar
          label="最近构建"
          actions={
            <>
              <Button
                type="button"
                size="sm"
                disabled={!canCreateBuild}
                onClick={() => {
                  setBuildError("");
                  setBuildSuccess("");
                  setReleaseSuccess("");
                  setIsCreateBuildDialogOpen(true);
                }}
              >
                <Plus className="size-4" />
                新增构建
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="刷新构建列表"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                <RefreshCw className="size-4" />
              </Button>
            </>
          }
        />

        {releaseSuccess ? <Alert variant="success">{releaseSuccess}</Alert> : null}
        {buildSuccess ? <Alert variant="success">{buildSuccess}</Alert> : null}

        <DataTable
          rows={snapshot.builds}
          columnDefs={columnDefs}
          getRowId={({ data }) => data.id}
          rowActionSelector="[data-build-row-action]"
          onRowClicked={(event) => {
            if (event.data) {
              onOpenBuild(event.data.id);
            }
          }}
        />

        <Card className="rounded-xl border-border bg-card py-0 shadow-xs">
          <TablePagination
            page={page}
            pageSize={PAGE_SIZE}
            total={snapshot.builds.length}
            onPageChange={setPage}
            onPageSizeChange={() => {
              // hook left here for future wiring; current snapshot returns the full list
            }}
          />
        </Card>
      </div>

      <BuildCreateDialog
        environmentOptions={environmentOptions}
        isEnvironmentsFetching={isEnvironmentsFetching}
        isModulesFetching={isModulesFetching}
        isOpen={isCreateBuildDialogOpen}
        moduleOptions={moduleOptions}
        submitError={buildError}
        onClose={() => {
          setIsCreateBuildDialogOpen(false);
          setBuildError("");
        }}
        onSubmit={async (form) => {
          setBuildError("");
          setBuildSuccess("");
          setReleaseSuccess("");

          try {
            const build = await createBuild({
              branch: form.branch,
              environment: form.environment,
              moduleId: form.moduleId,
            });
            setBuildSuccess(`构建已提交：${build.createdAt}`);
            setIsCreateBuildDialogOpen(false);
            await queryClient.invalidateQueries({ queryKey: buildsSnapshotQueryKey });
          } catch (error) {
            setBuildError(error instanceof Error ? error.message : "提交构建失败，请稍后重试");
          }
        }}
      />
      <BuildReleaseDialog
        activeFullRelease={
          releaseBuild
            ? activeFullReleaseByTarget.get(
                buildReleaseTargetKey(releaseBuild.moduleId, releaseBuild.environment),
              )
            : undefined
        }
        build={releaseBuild}
        isOpen={Boolean(releaseBuild)}
        submitError={releaseError}
        onClose={closeReleaseDialog}
        onSubmit={async (form) => {
          if (!releaseBuild) {
            return;
          }

          setReleaseError("");
          setReleaseSuccess("");

          try {
            const releaseCreatedAt = await createBuildRelease({
              buildRecordId: releaseBuild.id,
              expiresAt: form.expiresAt,
              grayPercentage: form.grayPercentage,
              grayStrategy: form.grayStrategy,
              identifier: form.identifier,
              releaseType: form.releaseType,
            });
            setReleaseSuccess(`发布已生效：${releaseCreatedAt}`);
            closeReleaseDialog();
            await queryClient.invalidateQueries({ queryKey: buildsSnapshotQueryKey });
            await queryClient.invalidateQueries({ queryKey: releaseRecordsSnapshotQueryKey });
          } catch (error) {
            setReleaseError(error instanceof Error ? error.message : "发布失败，请稍后重试");
          }
        }}
      />
    </>
  );
}

function BuildCell({ data }: ICellRendererParams<BuildRunRecord>) {
  if (!data) {
    return null;
  }

  return <span className="truncate font-semibold text-primary text-sm">{data.createdAt}</span>;
}

function BuildIDCell({ value }: ICellRendererParams<BuildRunRecord, string>) {
  return value ? (
    <span className="truncate font-mono font-semibold text-foreground text-xs">
      #{value.trim().slice(-8)}
    </span>
  ) : null;
}

function BranchCell({ data }: ICellRendererParams<BuildRunRecord>) {
  if (!data) {
    return null;
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate font-mono text-foreground text-xs">
        {data.branch} · {data.commit}
      </span>
    </span>
  );
}

function TriggerCell({ value }: ICellRendererParams<BuildRunRecord, BuildTriggerType>) {
  return value ? (
    <span className="font-medium text-foreground text-xs">{buildTriggerLabels[value]}</span>
  ) : null;
}

function StatusCell({ value }: ICellRendererParams<BuildRunRecord, BuildRunStatus>) {
  if (!value) {
    return null;
  }

  const Icon = value === "running" ? Activity : value === "queued" ? Clock3 : PackageCheck;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded border px-2 font-semibold text-xs leading-none",
        buildStatusClass[value],
      )}
    >
      <Icon className="size-3" />
      {value}
    </span>
  );
}

function ActionsCell({
  canCreateRelease,
  data,
  onPublish,
}: {
  canCreateRelease: boolean;
  data?: BuildRunRecord;
  onPublish: (build: BuildRunRecord) => void;
}) {
  if (!data) {
    return null;
  }

  const canPublish = canCreateRelease && data.status === "success";

  return (
    <div className="flex h-full items-center" data-build-row-action="true">
      <Button
        variant="outline"
        type="button"
        size="sm"
        className="h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
        disabled={!canPublish}
        onClick={(event) => {
          event.stopPropagation();
          onPublish(data);
        }}
      >
        <Rocket className="size-3.5" />
        发布
      </Button>
    </div>
  );
}

function buildReleaseTargetKey(moduleId: string, environment: string) {
  return `${moduleId}:${environment}`;
}

function isBuildOlderThanActiveRelease(
  build: BuildRunRecord,
  activeRelease: ActiveFullReleaseTarget,
) {
  const buildCreatedAt = Date.parse(build.createdAtRaw);
  const activeBuildCreatedAt = Date.parse(activeRelease.build?.createdAtRaw ?? "");

  if (!Number.isNaN(buildCreatedAt) && !Number.isNaN(activeBuildCreatedAt)) {
    return buildCreatedAt < activeBuildCreatedAt;
  }

  return false;
}

function BuildCreateDialog({
  environmentOptions,
  isEnvironmentsFetching,
  isModulesFetching,
  isOpen,
  moduleOptions,
  onClose,
  onSubmit,
  submitError,
}: {
  environmentOptions: BuildEnvironmentOption[];
  isEnvironmentsFetching: boolean;
  isModulesFetching: boolean;
  isOpen: boolean;
  moduleOptions: BuildModuleOption[];
  onClose: () => void;
  onSubmit: (form: BuildCreateFormState) => Promise<void>;
  submitError: string;
}) {
  const {
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<BuildCreateFormState>({
    defaultValues: {
      branch: "",
      environment: "",
      moduleId: "",
    },
  });
  const hasModuleOptions = moduleOptions.length > 0;
  const hasEnvironmentOptions = environmentOptions.length > 0;
  const selectedModuleId = watch("moduleId");
  const selectedModule = moduleOptions.find((module) => module.value === selectedModuleId);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      branch: "",
      environment: "",
      moduleId: "",
    });
  }, [isOpen, reset]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const firstModule = moduleOptions[0];
    const firstEnvironment = environmentOptions[0];
    const currentForm = getValues();

    if (!currentForm.moduleId && firstModule) {
      setValue("moduleId", firstModule.value, { shouldValidate: true });
      if (!currentForm.branch) {
        setValue("branch", firstModule.defaultBranch, { shouldValidate: true });
      }
    }
    if (!currentForm.environment && firstEnvironment) {
      setValue("environment", firstEnvironment.value, { shouldValidate: true });
    }
  }, [environmentOptions, getValues, isOpen, moduleOptions, setValue]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="build-create-dialog-title"
      describedBy="build-create-dialog-description"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader
          title="新增构建"
          description="选择模块、分支与环境后提交构建，产物会上传到环境绑定的存储配置。"
          titleId="build-create-dialog-title"
          descriptionId="build-create-dialog-description"
        />

        <div className="mt-4 space-y-4">
          <Field label="模块" inputId="build-create-module">
            <Controller
              control={control}
              name="moduleId"
              rules={{ required: "请选择模块" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    const nextModule = moduleOptions.find((module) => module.value === value);
                    setValue("branch", nextModule?.defaultBranch ?? "");
                  }}
                >
                  <SelectTrigger id="build-create-module" className="w-full">
                    <SelectValue placeholder={isModulesFetching ? "模块加载中" : "选择模块"} />
                  </SelectTrigger>
                  <SelectContent>
                    {moduleOptions.map((module) => (
                      <SelectItem key={module.value} value={module.value}>
                        {module.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedModule ? (
              <div className="truncate text-muted-foreground text-xs">
                {selectedModule.applicationName || "-"} · {selectedModule.repositoryFullName || "-"}
              </div>
            ) : null}
            {errors.moduleId ? (
              <div className="text-destructive text-xs">{errors.moduleId.message}</div>
            ) : null}
          </Field>

          <Field label="分支" inputId="build-create-branch">
            <Input
              id="build-create-branch"
              placeholder={selectedModule?.defaultBranch || "输入 Git 分支"}
              {...register("branch", {
                validate: (value) => (value.trim() ? true : "请输入分支"),
              })}
            />
            {errors.branch ? (
              <div className="text-destructive text-xs">{errors.branch.message}</div>
            ) : null}
          </Field>

          <Field label="环境" inputId="build-create-environment">
            <Controller
              control={control}
              name="environment"
              rules={{ required: "请选择环境" }}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="build-create-environment" className="w-full">
                    <SelectValue placeholder={isEnvironmentsFetching ? "环境加载中" : "选择环境"} />
                  </SelectTrigger>
                  <SelectContent>
                    {environmentOptions.map((environment) => (
                      <SelectItem key={environment.value} value={environment.value}>
                        {environment.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.environment ? (
              <div className="text-destructive text-xs">{errors.environment.message}</div>
            ) : null}
          </Field>

          {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
          {!isModulesFetching && !hasModuleOptions ? (
            <Alert variant="warning">暂无可用模块，请先在模块管理中创建模块。</Alert>
          ) : null}
          {!isEnvironmentsFetching && !hasEnvironmentOptions ? (
            <Alert variant="warning">暂无可用环境，请先在环境管理中创建环境。</Alert>
          ) : null}
        </div>

        <ModalFooter>
          <Button variant="outline" type="button" disabled={isSubmitting} onClick={onClose}>
            取消
          </Button>
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={
              isSubmitting ||
              isModulesFetching ||
              isEnvironmentsFetching ||
              !hasModuleOptions ||
              !hasEnvironmentOptions
            }
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                提交中
              </>
            ) : (
              "提交构建"
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function BuildReleaseDialog({
  activeFullRelease,
  build,
  isOpen,
  onClose,
  onSubmit,
  submitError,
}: {
  activeFullRelease?: ActiveFullReleaseTarget;
  build: BuildRunRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: BuildReleaseFormState) => Promise<void>;
  submitError: string;
}) {
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<BuildReleaseFormState>({
    defaultValues: {
      expiresAt: defaultTargetedGrayExpiresAt(),
      grayPercentage: 0,
      grayStrategy: "targeted",
      identifier: "",
      releaseType: "full",
    },
  });
  const releaseType = watch("releaseType");
  const grayStrategy = watch("grayStrategy");
  const isDuplicateFullRelease =
    releaseType === "full" && Boolean(build && activeFullRelease?.buildId === build.id);
  const isRollbackFullRelease =
    releaseType === "full" &&
    Boolean(
      build &&
        activeFullRelease &&
        activeFullRelease.buildId !== build.id &&
        isBuildOlderThanActiveRelease(build, activeFullRelease),
    );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    reset({
      expiresAt: defaultTargetedGrayExpiresAt(),
      grayPercentage: 0,
      grayStrategy: "targeted",
      identifier: "",
      releaseType: "full",
    });
  }, [isOpen, reset]);

  if (!isOpen || !build) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="build-release-dialog-title"
      describedBy="build-release-dialog-description"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader
          title="发布构建"
          titleId="build-release-dialog-title"
          descriptionId="build-release-dialog-description"
          description={`将 ${build.createdAt} 创建的构建发布到 ${build.version} 环境，发布后会更新访问路由指向。`}
        />

        <div className="mt-4 space-y-4">
          <Field label="发布类型" inputId="build-release-type">
            <Controller
              control={control}
              name="releaseType"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value: BuildReleaseType) => field.onChange(value)}
                >
                  <SelectTrigger id="build-release-type" className="w-full">
                    <SelectValue placeholder="选择发布类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">全量</SelectItem>
                    <SelectItem value="gray">灰度</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          {releaseType === "gray" ? (
            <Field label="灰度方式" inputId="build-release-gray-strategy">
              <Controller
                control={control}
                name="grayStrategy"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value: BuildReleaseGrayStrategy) => field.onChange(value)}
                  >
                    <SelectTrigger id="build-release-gray-strategy" className="w-full">
                      <SelectValue placeholder="选择灰度方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="targeted">定向</SelectItem>
                      <SelectItem value="percentage">比例</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          ) : null}

          {releaseType === "gray" && grayStrategy === "targeted" ? (
            <Field label="定向标识" inputId="build-release-identifier">
              <Input
                id="build-release-identifier"
                placeholder="输入用户、设备或实验标识"
                {...register("identifier", {
                  validate: (value) =>
                    releaseType !== "gray" || grayStrategy !== "targeted" || value.trim()
                      ? true
                      : "请输入定向标识",
                })}
              />
              {errors.identifier ? (
                <div className="text-destructive text-xs">{errors.identifier.message}</div>
              ) : null}
            </Field>
          ) : null}

          {releaseType === "gray" && grayStrategy === "targeted" ? (
            <Field label="过期时间" inputId="build-release-expires-at">
              <div className="grid gap-2">
                <Input
                  id="build-release-expires-at"
                  type="datetime-local"
                  {...register("expiresAt", {
                    validate: (value) => {
                      if (releaseType !== "gray" || grayStrategy !== "targeted") {
                        return true;
                      }
                      if (!value) {
                        return "请选择过期时间";
                      }
                      const expiresAt = new Date(value);
                      if (Number.isNaN(expiresAt.getTime())) {
                        return "请选择有效过期时间";
                      }
                      return expiresAt.getTime() > Date.now() ? true : "过期时间必须晚于当前时间";
                    },
                  })}
                />
                <div className="flex flex-wrap gap-2">
                  {[7, 15, 30].map((days) => (
                    <Button
                      key={days}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 border-border bg-card text-foreground"
                      onClick={() =>
                        setValue("expiresAt", targetedGrayExpiresAt(days), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                    >
                      {days} 天
                    </Button>
                  ))}
                </div>
                {errors.expiresAt ? (
                  <div className="text-destructive text-xs">{errors.expiresAt.message}</div>
                ) : null}
              </div>
            </Field>
          ) : null}

          {releaseType === "gray" && grayStrategy === "percentage" ? (
            <Field label="初始比例" inputId="build-release-gray-percentage">
              <Controller
                control={control}
                name="grayPercentage"
                rules={{
                  max: { message: "初始比例不能超过 99", value: 99 },
                  min: { message: "初始比例不能小于 0", value: 0 },
                }}
                render={({ field }) => {
                  const value =
                    typeof field.value === "number" && !Number.isNaN(field.value) ? field.value : 0;
                  const updateValue = (nextValue: number) =>
                    field.onChange(Math.min(99, Math.max(0, nextValue)));

                  return (
                    <div className="grid gap-2">
                      <div className="flex items-center gap-3">
                        <input
                          id="build-release-gray-percentage"
                          type="range"
                          min={0}
                          max={99}
                          value={value}
                          onChange={(event) => updateValue(Number(event.target.value))}
                          className="h-2 flex-1 accent-primary"
                        />
                        <Input
                          type="number"
                          min={0}
                          max={99}
                          value={value}
                          onChange={(event) => updateValue(Number(event.target.value))}
                          className="w-24"
                        />
                      </div>
                      {errors.grayPercentage ? (
                        <div className="text-destructive text-xs">
                          {errors.grayPercentage.message}
                        </div>
                      ) : null}
                    </div>
                  );
                }}
              />
            </Field>
          ) : null}

          {isDuplicateFullRelease ? (
            <Alert variant="warning">该构建已有生效中的全量发布，不能重复提交全量发布。</Alert>
          ) : null}
          {isRollbackFullRelease ? (
            <Alert variant="warning">
              当前生效构建创建于 {activeFullRelease?.build?.createdAt}
              ，早于它的构建发布会回退访问路由。
            </Alert>
          ) : null}

          {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
        </div>

        <ModalFooter>
          <Button variant="outline" type="button" disabled={isSubmitting} onClick={onClose}>
            取消
          </Button>
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isSubmitting || isDuplicateFullRelease}
          >
            {isSubmitting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                发布中
              </>
            ) : (
              "确认发布"
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function defaultTargetedGrayExpiresAt() {
  return targetedGrayExpiresAt(7);
}

function targetedGrayExpiresAt(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return formatDatetimeLocal(value);
}

function formatDatetimeLocal(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hour = `${value.getHours()}`.padStart(2, "0");
  const minute = `${value.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function Field({
  children,
  inputId,
  label,
}: {
  children: ReactNode;
  inputId: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="font-medium text-muted-foreground text-xs">
        {label}
      </label>
      {children}
    </div>
  );
}
