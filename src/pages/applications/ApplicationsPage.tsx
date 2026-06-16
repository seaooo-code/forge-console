import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Activity,
  AppWindow,
  ArchiveX,
  CircleDot,
  MonitorSmartphone,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
  Wrench,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { searchFeishuUsers } from "@/api/feishu-user-search";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  ConsoleClearableFilterSelect,
  ConsoleOwnerSearchFilter,
  ConsoleSearchInput,
  ConsoleTableFooter,
} from "@/components/common/ConsoleControls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  applicationDeleteCheckQueryKey,
  applicationsSnapshotQueryKey,
} from "./api/application-list-filters";
import {
  deleteApplication,
  fetchApplicationDeleteCheck,
  fetchApplicationsSnapshot,
  updateApplicationStatus,
} from "./api/applications-snapshot";
import {
  applicationStatusClass,
  applicationsGridTheme,
  emptyApplicationListFilters,
} from "./constants";
import { useApplicationOptions } from "./hooks";
import type { ApplicationListFilters, ApplicationStatusCode, HostApplication } from "./types";

type ApplicationsPageProps = {
  onConfigureApplication: (applicationSlug: string) => void;
  onCreateApplication: () => void;
  onOpenApplication: (applicationSlug: string) => void;
};

export function ApplicationsPage({
  onConfigureApplication,
  onCreateApplication,
  onOpenApplication,
}: ApplicationsPageProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ApplicationListFilters>(emptyApplicationListFilters);
  const {
    data: snapshot,
    isFetching,
    refetch,
  } = useQuery({
    queryFn: () => fetchApplicationsSnapshot(filters),
    queryKey: applicationsSnapshotQueryKey(filters),
  });
  const { data: applicationOptions } = useApplicationOptions();
  const [keywordInput, setKeywordInput] = useState(filters.keyword);
  const [statusActionTarget, setStatusActionTarget] = useState<HostApplication | null>(null);
  const [statusActionError, setStatusActionError] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HostApplication | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteTargetSlug = deleteTarget?.slug;
  const {
    data: deleteCheck,
    isError: isDeleteCheckError,
    isFetching: isCheckingDelete,
  } = useQuery({
    enabled: deleteTargetSlug !== undefined,
    queryFn: () => fetchApplicationDeleteCheck(deleteTargetSlug ?? ""),
    queryKey: applicationDeleteCheckQueryKey(deleteTargetSlug),
    retry: false,
  });
  const handleRequestUpdateApplicationStatus = useCallback((application: HostApplication) => {
    setStatusActionTarget(application);
    setStatusActionError("");
  }, []);
  const handleRequestDeleteApplication = useCallback((application: HostApplication) => {
    setDeleteTarget(application);
    setDeleteError("");
  }, []);
  const updateFilters = useCallback(
    (patch: Partial<ApplicationListFilters>) => {
      setFilters({
        ...filters,
        ...patch,
      });
    },
    [filters],
  );

  useEffect(() => {
    setKeywordInput(filters.keyword);
  }, [filters.keyword]);

  useEffect(() => {
    const nextKeyword = keywordInput.trim();
    if (nextKeyword === filters.keyword) {
      return;
    }

    const handle = window.setTimeout(() => {
      updateFilters({ keyword: nextKeyword });
    }, 360);

    return () => window.clearTimeout(handle);
  }, [filters.keyword, keywordInput, updateFilters]);

  const stats = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    const { summary } = snapshot;

    return [
      {
        detail: "全部启用",
        icon: AppWindow,
        iconClass: "bg-blue-50 text-blue-600",
        id: "total",
        label: "应用总数",
        value: summary.total,
      },
      {
        detail: percentage(summary.running, summary.total),
        icon: Activity,
        iconClass: "bg-emerald-50 text-emerald-600",
        id: "running",
        label: "运行中",
        value: summary.running,
      },
      {
        detail: percentage(summary.maintenance, summary.total),
        icon: Wrench,
        iconClass: "bg-amber-50 text-amber-600",
        id: "maintenance",
        label: "维护中",
        value: summary.maintenance,
      },
      {
        detail: "归档",
        icon: ArchiveX,
        iconClass: "bg-slate-100 text-slate-500",
        id: "offline",
        label: "已下线",
        value: summary.offline,
      },
    ];
  }, [snapshot]);
  const platformFilterOptions = useMemo(
    () => applicationOptions?.platforms ?? [],
    [applicationOptions?.platforms],
  );
  const statusFilterOptions = useMemo(
    () => applicationOptions?.applicationStatuses ?? [],
    [applicationOptions?.applicationStatuses],
  );

  const columnDefs = useMemo<ColDef<HostApplication>[]>(
    () => [
      {
        cellRenderer: AppNameCell,
        field: "name",
        flex: 1.45,
        headerName: "应用",
        minWidth: 260,
      },
      {
        field: "platform",
        flex: 1.05,
        headerName: "平台",
        minWidth: 210,
      },
      {
        cellRenderer: OwnerCell,
        field: "owner",
        flex: 0.8,
        headerName: "负责人",
        minWidth: 160,
      },
      {
        field: "moduleCount",
        flex: 0.55,
        headerName: "模块数",
        minWidth: 92,
      },
      {
        field: "environmentCount",
        flex: 0.55,
        headerName: "环境数",
        minWidth: 92,
      },
      {
        field: "createdAt",
        flex: 0.85,
        headerName: "创建时间",
        minWidth: 130,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.7,
        headerName: "状态",
        minWidth: 112,
      },
      {
        cellRenderer: ActionsCell,
        cellRendererParams: {
          onConfigureApplication,
          onDeleteApplication: handleRequestDeleteApplication,
          onUpdateApplicationStatus: handleRequestUpdateApplicationStatus,
          onOpenApplication,
        },
        colId: "actions",
        flex: 1.05,
        headerName: "操作",
        minWidth: 196,
        sortable: false,
      },
    ],
    [
      handleRequestDeleteApplication,
      handleRequestUpdateApplicationStatus,
      onConfigureApplication,
      onOpenApplication,
    ],
  );

  const defaultColDef = useMemo<ColDef<HostApplication>>(
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
    return <ApplicationsPageLoading />;
  }

  const { applications } = snapshot;
  const statusActionLabel = statusActionTarget?.status === "已下线" ? "上线" : "下线";
  const nextStatus: ApplicationStatusCode =
    statusActionTarget?.status === "已下线" ? "running" : "offline";

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">应用管理</h1>
          <p className="mt-2 text-slate-600 text-sm">管理 RN Bundle 平台接入的所有宿主应用</p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.id} className="rounded-lg px-5 py-4 shadow-none">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="font-medium text-slate-500 text-sm">{item.label}</div>
                    <div className="font-semibold text-3xl text-slate-950 leading-none">
                      {item.value}
                    </div>
                    <div className="font-medium text-slate-400 text-xs">{item.detail}</div>
                  </div>
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      item.iconClass,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ConsoleClearableFilterSelect
                icon={MonitorSmartphone}
                label="平台"
                value={filters.platform}
                options={platformFilterOptions}
                clearLabel="清空平台筛选"
                onClear={() => updateFilters({ platform: "" })}
                onValueChange={(value) => updateFilters({ platform: value })}
              />
              <ConsoleClearableFilterSelect
                icon={CircleDot}
                label="状态"
                value={filters.status}
                options={statusFilterOptions}
                clearLabel="清空状态筛选"
                onClear={() => updateFilters({ status: "" })}
                onValueChange={(value) => updateFilters({ status: value as ApplicationStatusCode })}
              />
              <ConsoleOwnerSearchFilter
                value={filters.owner}
                searchUsers={searchFeishuUsers}
                onValueChange={(owner) => updateFilters({ owner })}
              />
              <ConsoleSearchInput
                value={keywordInput}
                placeholder="搜索应用名称"
                onChange={setKeywordInput}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                type="button"
                size="icon"
                aria-label="刷新应用列表"
                onClick={() => {
                  void refetch();
                }}
              >
                <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={onCreateApplication}>
                <Plus className="size-4" />
                新建应用
              </Button>
            </div>
          </div>

          <AgGridReact<HostApplication>
            rowData={applications}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={58}
            theme={applicationsGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />

          <ConsoleTableFooter total={applications.length} />
        </section>
      </div>
      <ConfirmDialog
        isOpen={statusActionTarget !== null}
        isPending={isUpdatingStatus}
        title={`${statusActionLabel}应用`}
        description={
          statusActionTarget
            ? `确认${statusActionLabel}「${statusActionTarget.name}」？应用状态将更新为${nextStatus === "running" ? "运行中" : "已下线"}。`
            : ""
        }
        confirmLabel={`${statusActionLabel}应用`}
        tone={nextStatus === "offline" ? "danger" : "default"}
        onCancel={() => {
          if (isUpdatingStatus) {
            return;
          }
          setStatusActionTarget(null);
          setStatusActionError("");
        }}
        onConfirm={async () => {
          if (!statusActionTarget) {
            return;
          }

          setIsUpdatingStatus(true);
          setStatusActionError("");
          try {
            await updateApplicationStatus(statusActionTarget.slug, nextStatus);
            await queryClient.invalidateQueries({ queryKey: applicationsSnapshotQueryKey() });
            setStatusActionTarget(null);
          } catch (error) {
            setStatusActionError(
              error instanceof Error ? error.message : `${statusActionLabel}应用失败，请稍后重试`,
            );
          } finally {
            setIsUpdatingStatus(false);
          }
        }}
      >
        {statusActionError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 text-sm">
            {statusActionError}
          </div>
        ) : null}
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        isPending={isDeleting}
        isConfirmDisabled={
          isCheckingDelete || isDeleteCheckError || deleteCheck?.deletable !== true
        }
        title="删除应用"
        description={
          deleteTarget
            ? `确认删除「${deleteTarget.name}」？删除前会检查依赖，检查通过后将彻底删除。`
            : ""
        }
        confirmLabel="删除应用"
        tone="danger"
        onCancel={() => {
          if (isDeleting) {
            return;
          }
          setDeleteTarget(null);
          setDeleteError("");
        }}
        onConfirm={async () => {
          if (!deleteTarget || deleteCheck?.deletable !== true) {
            return;
          }

          setIsDeleting(true);
          setDeleteError("");
          try {
            await deleteApplication(deleteTarget.slug);
            await queryClient.invalidateQueries({ queryKey: applicationsSnapshotQueryKey() });
            setDeleteTarget(null);
          } catch (error) {
            setDeleteError(error instanceof Error ? error.message : "删除应用失败，请稍后重试");
          } finally {
            setIsDeleting(false);
          }
        }}
      >
        {isCheckingDelete ? (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-blue-700 text-sm">
            正在检查应用依赖
          </div>
        ) : null}
        {isDeleteCheckError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 text-sm">
            依赖检查失败，请稍后重试
          </div>
        ) : null}
        {deleteCheck?.message ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600 text-sm">
            {deleteCheck.message}
          </div>
        ) : null}
        {deleteCheck && deleteCheck.dependencies.length > 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700 text-sm">
            <div className="font-medium">存在依赖，不能删除</div>
            <div className="mt-2 space-y-1">
              {deleteCheck.dependencies.map((dependency) => (
                <div key={dependency.id} className="flex min-w-0 items-start gap-2">
                  <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 font-medium text-amber-800 text-xs">
                    {dependency.type}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{dependency.name}</span>
                    {dependency.description ? (
                      <span className="block truncate text-amber-600 text-xs">
                        {dependency.description}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {deleteCheck?.deletable && deleteCheck.dependencies.length === 0 ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700 text-sm">
            依赖检查通过，确认后将彻底删除。
          </div>
        ) : null}
        {deleteError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 text-sm">
            {deleteError}
          </div>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

function ApplicationsPageLoading() {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">应用管理</h1>
        <p className="mt-2 text-slate-600 text-sm">管理 RN Bundle 平台接入的所有宿主应用</p>
      </div>
      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-4">
          {["total", "running", "maintenance", "offline"].map((item) => (
            <Card key={item} className="h-32 animate-pulse rounded-lg bg-white shadow-none" />
          ))}
        </section>
        <Card className="h-96 animate-pulse rounded-lg border-slate-200 bg-white shadow-none" />
      </div>
    </>
  );
}

function AppNameCell({ data }: ICellRendererParams<HostApplication>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex h-full items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-rose-500 text-white shadow-sm">
        <Smartphone className="size-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold text-slate-900">{data.name}</div>
        <div className="font-mono text-slate-500 text-xs">{data.slug}</div>
      </div>
    </div>
  );
}

function StatusCell({ value }: ICellRendererParams<HostApplication, HostApplication["status"]>) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex h-full items-center">
      <span
        className={cn(
          "inline-flex h-6 items-center rounded border px-2 font-medium text-xs leading-none",
          applicationStatusClass[value],
        )}
      >
        {value}
      </span>
    </div>
  );
}

function OwnerCell({ data }: ICellRendererParams<HostApplication>) {
  if (!data) {
    return null;
  }

  const owner = data.owner;

  return (
    <div className="flex h-full min-w-0 items-center gap-2">
      <OwnerAvatar name={owner} src={data.ownerAvatarUrl} />
      <div className="min-w-0">
        <div className="truncate font-medium text-slate-800 text-sm">{owner}</div>
        {data.ownerEmail ? (
          <div className="truncate text-slate-500 text-xs">{data.ownerEmail}</div>
        ) : null}
      </div>
    </div>
  );
}

function OwnerAvatar({ name, src }: { name: string; src: string }) {
  if (src) {
    return <img src={src} alt={name} className="size-7 shrink-0 rounded-full object-cover" />;
  }

  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-rose-500 font-semibold text-white text-xs">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function ActionsCell({
  data,
  onConfigureApplication,
  onDeleteApplication,
  onOpenApplication,
  onUpdateApplicationStatus,
}: ICellRendererParams<HostApplication> & {
  onConfigureApplication?: (applicationSlug: string) => void;
  onDeleteApplication?: (application: HostApplication) => void;
  onOpenApplication?: (applicationSlug: string) => void;
  onUpdateApplicationStatus?: (application: HostApplication) => void;
}) {
  const isOffline = data?.status === "已下线";
  const StatusActionIcon = isOffline ? Activity : ArchiveX;

  return (
    <div className="flex h-full items-center gap-2 whitespace-nowrap font-medium text-xs">
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
        onClick={() => {
          if (data) {
            onOpenApplication?.(data.slug);
          }
        }}
      >
        详情
      </Button>
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
        onClick={() => {
          if (data) {
            onConfigureApplication?.(data.slug);
          }
        }}
      >
        配置
      </Button>
      <Button
        variant="link"
        type="button"
        className={cn(
          "h-auto gap-1 p-0 text-xs",
          isOffline
            ? "text-emerald-600 hover:text-emerald-700"
            : "text-slate-600 hover:text-slate-800",
        )}
        onClick={() => {
          if (data) {
            onUpdateApplicationStatus?.(data);
          }
        }}
      >
        <StatusActionIcon className="size-3.5" />
        {isOffline ? "上线" : "下线"}
      </Button>
      <Button
        variant="link"
        type="button"
        className="h-auto gap-1 p-0 text-rose-600 text-xs hover:text-rose-700 disabled:text-slate-400"
        onClick={() => {
          if (data) {
            onDeleteApplication?.(data);
          }
        }}
      >
        <Trash2 className="size-3.5" />
        删除
      </Button>
    </div>
  );
}

function percentage(value: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}
