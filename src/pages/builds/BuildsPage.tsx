import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams, RowClickedEvent } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
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
import { ConsoleTableFooter } from "@/components/common/ConsoleControls";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
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
import type { AuthUser } from "@/types/auth";

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
  BuildReleaseType,
  BuildRunRecord,
  BuildRunStatus,
  BuildTriggerType,
} from "./types";

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
            { id: "total", label: "总构建", value: snapshot.summary.total, tone: "sky" },
            { id: "running", label: "构建中", value: snapshot.summary.running, tone: "blue" },
            { id: "success", label: "成功", value: snapshot.summary.success, tone: "emerald" },
            { id: "failed", label: "失败", value: snapshot.summary.failed, tone: "red" },
            { id: "queued", label: "排队中", value: snapshot.summary.queued, tone: "amber" },
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
          <ActionsCell data={params.data} onPublish={openReleaseDialog} />
        ),
        colId: "actions",
        flex: 0.65,
        headerName: "操作",
        minWidth: 92,
        sortable: false,
      },
    ],
    [openReleaseDialog],
  );
  const defaultColDef = useMemo<ColDef<BuildRunRecord>>(
    () => ({
      cellClass: "flex items-center",
      cellStyle: {
        alignItems: "center",
        display: "flex",
      },
      resizable: false,
      sortable: false,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
    }),
    [],
  );

  if (!snapshot) {
    return null;
  }

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">构建管理</h1>
        <p className="mt-2 text-slate-600 text-sm">
          汇总所有模块构建执行，支持手动新增构建并跟踪流水线触发结果
        </p>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {stats.map((item) => (
            <Card key={item.id} className="rounded-lg px-5 py-4 shadow-none">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-slate-500 text-sm">{item.label}</div>
                  <div className="mt-2 font-semibold text-3xl text-slate-950 leading-none">
                    {item.value}
                  </div>
                </div>
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border",
                    item.tone === "emerald" && "border-emerald-200 bg-emerald-50 text-emerald-600",
                    item.tone === "red" && "border-red-200 bg-red-50 text-red-600",
                    item.tone === "amber" && "border-amber-200 bg-amber-50 text-amber-600",
                    item.tone === "blue" && "border-blue-200 bg-blue-50 text-blue-600",
                    item.tone === "sky" && "border-sky-200 bg-sky-50 text-sky-600",
                  )}
                >
                  <Circle className="size-2 fill-current" />
                </div>
              </div>
            </Card>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-medium text-slate-500 text-sm">最近构建</span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700"
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
            </div>
            {releaseSuccess ? (
              <div className="basis-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-sm">
                {releaseSuccess}
              </div>
            ) : null}
            {buildSuccess ? (
              <div className="basis-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-sm">
                {buildSuccess}
              </div>
            ) : null}
          </div>

          <AgGridReact<BuildRunRecord>
            rowData={snapshot.builds}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={58}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
            rowClass="cursor-pointer"
            onRowClicked={(event) => {
              if (event.data && !isBuildRowActionEvent(event)) {
                onOpenBuild(event.data.id);
              }
            }}
          />

          <ConsoleTableFooter total={snapshot.builds.length} />
        </section>
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

          const createdByUserId = getCurrentUserId(session?.user);
          if (!createdByUserId) {
            setReleaseError("当前登录态缺少用户 ID，无法发布");
            return;
          }

          setReleaseError("");
          setReleaseSuccess("");

          try {
            const releaseCreatedAt = await createBuildRelease({
              buildRecordId: releaseBuild.id,
              createdByUserId,
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

  return <span className="truncate font-semibold text-blue-600 text-sm">{data.createdAt}</span>;
}

function BuildIDCell({ value }: ICellRendererParams<BuildRunRecord, string>) {
  return value ? (
    <span className="truncate font-mono font-semibold text-slate-700 text-xs">
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
      <GitBranch className="size-3.5 shrink-0 text-slate-400" />
      <span className="truncate font-mono text-slate-700 text-xs">
        {data.branch} · {data.commit}
      </span>
    </span>
  );
}

function TriggerCell({ value }: ICellRendererParams<BuildRunRecord, BuildTriggerType>) {
  return value ? (
    <span className="font-medium text-slate-700 text-xs">{buildTriggerLabels[value]}</span>
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
  data,
  onPublish,
}: {
  data?: BuildRunRecord;
  onPublish: (build: BuildRunRecord) => void;
}) {
  if (!data) {
    return null;
  }

  const canPublish = data.status === "success";

  return (
    <div className="flex h-full items-center" data-build-row-action="true">
      <Button
        variant="outline"
        type="button"
        size="sm"
        className="h-8 gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
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

function isBuildRowActionEvent(event: RowClickedEvent<BuildRunRecord>) {
  const target = event.event?.target;
  return target instanceof Element && Boolean(target.closest("[data-build-row-action]"));
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-xs">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="build-create-dialog-title"
        aria-describedby="build-create-dialog-description"
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <h2 id="build-create-dialog-title" className="font-semibold text-lg text-slate-950">
              新增构建
            </h2>
            <p id="build-create-dialog-description" className="text-slate-600 text-sm leading-6">
              选择模块、分支与环境后提交构建，产物会上传到环境绑定的存储配置。
            </p>
          </div>

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
                <div className="truncate text-slate-500 text-xs">
                  {selectedModule.applicationName || "-"} ·{" "}
                  {selectedModule.repositoryFullName || "-"}
                </div>
              ) : null}
              {errors.moduleId ? (
                <div className="text-rose-600 text-xs">{errors.moduleId.message}</div>
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
                <div className="text-rose-600 text-xs">{errors.branch.message}</div>
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
                      <SelectValue
                        placeholder={isEnvironmentsFetching ? "环境加载中" : "选择环境"}
                      />
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
                <div className="text-rose-600 text-xs">{errors.environment.message}</div>
              ) : null}
            </Field>

            {submitError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 text-sm">
                {submitError}
              </div>
            ) : null}
            {!isModulesFetching && !hasModuleOptions ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 text-sm">
                暂无可用模块，请先在模块管理中创建模块。
              </div>
            ) : null}
            {!isEnvironmentsFetching && !hasEnvironmentOptions ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 text-sm">
                暂无可用环境，请先在环境管理中创建环境。
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" type="button" disabled={isSubmitting} onClick={onClose}>
              取消
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
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
          </div>
        </form>
      </section>
    </div>
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
    watch,
  } = useForm<BuildReleaseFormState>({
    defaultValues: {
      identifier: "",
      releaseType: "full",
    },
  });
  const releaseType = watch("releaseType");
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
      identifier: "",
      releaseType: "full",
    });
  }, [isOpen, reset]);

  if (!isOpen || !build) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-xs">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="build-release-dialog-title"
        aria-describedby="build-release-dialog-description"
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <h2 id="build-release-dialog-title" className="font-semibold text-lg text-slate-950">
              发布构建
            </h2>
            <p id="build-release-dialog-description" className="text-slate-600 text-sm leading-6">
              将 {build.createdAt} 创建的构建发布到 {build.version} 环境，发布后会更新访问路由指向。
            </p>
          </div>

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
                      <SelectItem value="full">全量发布</SelectItem>
                      <SelectItem value="targeted">定向发布</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            {releaseType === "targeted" ? (
              <Field label="定向标识" inputId="build-release-identifier">
                <Input
                  id="build-release-identifier"
                  placeholder="输入用户、设备或实验标识"
                  {...register("identifier", {
                    validate: (value) =>
                      releaseType !== "targeted" || value.trim() ? true : "请输入定向标识",
                  })}
                />
                {errors.identifier ? (
                  <div className="text-rose-600 text-xs">{errors.identifier.message}</div>
                ) : null}
              </Field>
            ) : null}

            {isDuplicateFullRelease ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 text-sm">
                该构建已有生效中的全量发布，不能重复提交全量发布。
              </div>
            ) : null}
            {isRollbackFullRelease ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 text-sm">
                当前生效构建创建于 {activeFullRelease?.build?.createdAt}
                ，早于它的构建发布会回退访问路由。
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 text-sm">
                {submitError}
              </div>
            ) : null}
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" type="button" disabled={isSubmitting} onClick={onClose}>
              取消
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700"
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
          </div>
        </form>
      </section>
    </div>
  );
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
      <label htmlFor={inputId} className="font-medium text-slate-600 text-xs">
        {label}
      </label>
      {children}
    </div>
  );
}

function getCurrentUserId(user: AuthUser | undefined) {
  return user?.openId?.trim() || user?.userId?.trim() || user?.unionId?.trim() || "";
}
