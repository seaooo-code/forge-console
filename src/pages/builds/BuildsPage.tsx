import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Activity,
  Circle,
  Clock3,
  GitBranch,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

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
import { releaseRecordsSnapshotQueryKey } from "@/pages/release-records";
import { useAuthStore } from "@/store/use-auth-store";
import type { AuthUser } from "@/types/auth";

import {
  buildsSnapshotQueryKey,
  createBuildRelease,
  fetchBuildsSnapshot,
} from "./api/builds-snapshot";
import { buildStatusClass, buildTriggerLabels } from "./constants";
import type {
  BuildReleaseFormState,
  BuildReleaseType,
  BuildRunRecord,
  BuildRunStatus,
  BuildTriggerType,
} from "./types";

type BuildsPageProps = {
  onOpenBuild: (buildId: string) => void;
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
  const [releaseBuild, setReleaseBuild] = useState<BuildRunRecord | null>(null);
  const [releaseError, setReleaseError] = useState("");
  const [releaseSuccess, setReleaseSuccess] = useState("");
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
        cellRenderer: BuildCell,
        field: "id",
        flex: 1,
        headerName: "构建编号",
        minWidth: 168,
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
        <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">构建记录</h1>
        <p className="mt-2 text-slate-600 text-sm">
          汇总所有模块构建执行，区分手动触发、任务触发与流水线触发
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
                variant="outline"
                size="icon"
                aria-label="刷新构建记录"
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
            onRowClicked={({ data }) => {
              if (data) {
                onOpenBuild(data.id);
              }
            }}
          />

          <ConsoleTableFooter total={snapshot.builds.length} />
        </section>
      </div>

      <BuildReleaseDialog
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
            const releaseId = await createBuildRelease({
              buildRecordId: releaseBuild.id,
              createdByUserId,
              identifier: form.identifier,
              releaseType: form.releaseType,
            });
            setReleaseSuccess(`发布已提交：${releaseId}`);
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

  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate font-semibold text-blue-600 text-sm">{data.id}</div>
      <div className="mt-1 truncate text-slate-600 text-xs">{data.artifact}</div>
    </div>
  );
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
    <div className="flex h-full items-center">
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

function BuildReleaseDialog({
  build,
  isOpen,
  onClose,
  onSubmit,
  submitError,
}: {
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
              将构建「{build.id}」发布到 {build.version} 环境，发布后会更新访问路由指向。
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
              disabled={isSubmitting}
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
