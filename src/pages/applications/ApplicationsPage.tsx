import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
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
} from "@/components/common/ConsoleControls";
import {
  DataTable,
  FilterBar,
  KpiCard,
  PageEmptyState,
  PageHeader,
  TablePagination,
} from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePagination } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

import {
  applicationDeleteCheckQueryKey,
  applicationsRootQueryKey,
  applicationsSnapshotQueryKey,
} from "./api/application-list-filters";
import {
  deleteApplication,
  fetchApplicationDeleteCheck,
  fetchApplicationsSnapshot,
  updateApplicationStatus,
} from "./api/applications-snapshot";
import { applicationStatusClass, emptyApplicationListFilters } from "./constants";
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
  const session = useAuthStore((state) => state.session);
  const canCreateApplication = Boolean(session?.capabilities.canCreateApplication);
  const canManageApplications = Boolean(session?.capabilities.canManageApplications);
  const [filters, setFilters] = useState<ApplicationListFilters>(emptyApplicationListFilters);
  const { clampPage, page, pageSize, resetPage, setPage, setPageSize } = usePagination();
  const {
    data: snapshot,
    error,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchApplicationsSnapshot({ ...filters, page, pageSize }),
    queryKey: applicationsSnapshotQueryKey({ ...filters, page, pageSize }),
  });
  const { data: overviewSnapshot, refetch: refetchOverview } = useQuery({
    queryFn: () => fetchApplicationsSnapshot(),
    queryKey: applicationsSnapshotQueryKey(),
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
      setFilters((current) => ({ ...current, ...patch }));
      resetPage();
    },
    [resetPage],
  );

  useEffect(() => {
    setKeywordInput(filters.keyword);
  }, [filters.keyword]);

  useEffect(() => {
    if (snapshot) {
      clampPage(snapshot.pagination.total);
    }
  }, [clampPage, snapshot]);

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
    if (!overviewSnapshot) {
      return [];
    }

    const { summary } = overviewSnapshot;
    return [
      {
        detail: "全部接入",
        icon: AppWindow,
        iconTone: "info" as const,
        id: "total",
        label: "应用总数",
        value: summary.total,
      },
      {
        detail: percentage(summary.running, summary.total),
        icon: Activity,
        iconTone: "success" as const,
        id: "running",
        label: "运行中",
        value: summary.running,
      },
      {
        detail: percentage(summary.maintenance, summary.total),
        icon: Wrench,
        iconTone: "warning" as const,
        id: "maintenance",
        label: "维护中",
        value: summary.maintenance,
      },
      {
        detail: "归档",
        icon: ArchiveX,
        iconTone: "muted" as const,
        id: "offline",
        label: "已下线",
        value: summary.offline,
      },
    ];
  }, [overviewSnapshot]);
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
        flex: 1.6,
        headerName: "应用",
        minWidth: 280,
      },
      {
        field: "platform",
        flex: 1.05,
        headerName: "平台",
        minWidth: 180,
      },
      {
        cellRenderer: OwnerCell,
        field: "owner",
        flex: 0.9,
        headerName: "负责人",
        minWidth: 180,
      },
      {
        field: "moduleCount",
        flex: 0.5,
        headerName: "模块",
        minWidth: 80,
      },
      {
        field: "environmentCount",
        flex: 0.5,
        headerName: "环境",
        minWidth: 80,
      },
      {
        field: "createdAt",
        flex: 0.8,
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
          canManage: canManageApplications,
          onConfigureApplication,
          onDeleteApplication: handleRequestDeleteApplication,
          onUpdateApplicationStatus: handleRequestUpdateApplicationStatus,
        },
        colId: "actions",
        flex: 0.9,
        headerName: "操作",
        minWidth: 150,
        sortable: false,
      },
    ],
    [
      canManageApplications,
      handleRequestDeleteApplication,
      handleRequestUpdateApplicationStatus,
      onConfigureApplication,
    ],
  );

  if (isError && !snapshot) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="应用管理" description="管理 RN Bundle 平台接入的所有宿主应用" />
        <PageEmptyState
          icon={AppWindow}
          title="加载应用列表失败"
          description={error instanceof Error ? error.message : "请稍后重试"}
          action={
            <Button type="button" onClick={() => void refetch()}>
              <RefreshCw className="size-4" />
              重试
            </Button>
          }
        />
      </div>
    );
  }

  if (!snapshot) {
    return <ApplicationsPageLoading />;
  }

  const { applications } = snapshot;
  const statusActionLabel = statusActionTarget?.status === "已下线" ? "上线" : "下线";
  const nextStatus: ApplicationStatusCode =
    statusActionTarget?.status === "已下线" ? "running" : "offline";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="应用管理" description="管理 RN Bundle 平台接入的所有宿主应用" />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <KpiCard
              key={item.id}
              icon={Icon}
              label={item.label}
              value={item.value}
              detail={item.detail}
              tone={item.iconTone}
            />
          );
        })}
      </section>

      <FilterBar
        label="筛选"
        primary={
          <>
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
          </>
        }
        actions={
          <>
            <Button size="sm" disabled={!canCreateApplication} onClick={onCreateApplication}>
              <Plus className="size-4" />
              新建应用
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="刷新应用列表"
              disabled={isFetching}
              onClick={() => {
                void refetch();
                void refetchOverview();
              }}
            >
              <RefreshCw className="size-4" />
            </Button>
          </>
        }
      />

      <DataTable
        rows={applications}
        columnDefs={columnDefs}
        getRowId={({ data }) => data.id}
        rowActionSelector="[data-application-row-action]"
        onRowClicked={(event) => {
          if (event.data) {
            onOpenApplication(event.data.slug);
          }
        }}
      />

      <Card className="rounded-xl border-border bg-card py-0 shadow-xs">
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={snapshot.pagination.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

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
            await queryClient.invalidateQueries({ queryKey: applicationsRootQueryKey });
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
        {statusActionError ? <Alert variant="danger">{statusActionError}</Alert> : null}
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
            await queryClient.invalidateQueries({ queryKey: applicationsRootQueryKey });
            setDeleteTarget(null);
          } catch (error) {
            setDeleteError(error instanceof Error ? error.message : "删除应用失败，请稍后重试");
          } finally {
            setIsDeleting(false);
          }
        }}
      >
        {isCheckingDelete ? <Alert variant="info">正在检查应用依赖</Alert> : null}
        {isDeleteCheckError ? <Alert variant="danger">依赖检查失败，请稍后重试</Alert> : null}
        {deleteCheck?.message ? <Alert variant="default">{deleteCheck.message}</Alert> : null}
        {deleteCheck && deleteCheck.dependencies.length > 0 ? (
          <Alert variant="warning">
            <div className="font-medium">存在依赖，不能删除</div>
            <div className="mt-2 space-y-1">
              {deleteCheck.dependencies.map((dependency) => (
                <div key={dependency.id} className="flex min-w-0 items-start gap-2">
                  <span className="shrink-0 rounded bg-warning/20 px-1.5 py-0.5 font-medium text-warning text-xs">
                    {dependency.type}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{dependency.name}</span>
                    {dependency.description ? (
                      <span className="block truncate text-warning/80 text-xs">
                        {dependency.description}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          </Alert>
        ) : null}
        {deleteCheck?.deletable && deleteCheck.dependencies.length === 0 ? (
          <Alert variant="success">依赖检查通过，确认后将彻底删除。</Alert>
        ) : null}
        {deleteError ? <Alert variant="danger">{deleteError}</Alert> : null}
      </ConfirmDialog>
    </div>
  );
}

function ApplicationsPageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="h-22 animate-pulse rounded-xl border-border bg-card shadow-xs" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {["total", "running", "maintenance", "offline"].map((item) => (
          <Card
            key={item}
            className="h-28 animate-pulse rounded-xl border-border bg-card shadow-xs"
          />
        ))}
      </div>
      <Card className="h-96 animate-pulse rounded-xl border-border bg-card shadow-xs" />
    </div>
  );
}

function AppNameCell({ data }: ICellRendererParams<HostApplication>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex h-full items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
        <Smartphone className="size-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold text-foreground">{data.name}</div>
        <div className="font-mono text-muted-foreground text-xs">{data.slug}</div>
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
        <div className="truncate font-medium text-foreground text-sm">{owner}</div>
        {data.ownerEmail ? (
          <div className="truncate text-muted-foreground text-xs">{data.ownerEmail}</div>
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
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function ActionsCell({
  canManage,
  data,
  onConfigureApplication,
  onDeleteApplication,
  onUpdateApplicationStatus,
}: ICellRendererParams<HostApplication> & {
  canManage?: boolean;
  onConfigureApplication?: (applicationSlug: string) => void;
  onDeleteApplication?: (application: HostApplication) => void;
  onUpdateApplicationStatus?: (application: HostApplication) => void;
}) {
  const isOffline = data?.status === "已下线";
  const StatusActionIcon = isOffline ? Activity : ArchiveX;

  return (
    <div
      className="flex h-full items-center gap-2 whitespace-nowrap font-medium text-xs"
      data-application-row-action="true"
    >
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-primary text-xs hover:text-primary/80"
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
        disabled={!canManage}
        className={cn(
          "h-auto gap-1 p-0 text-xs disabled:text-muted-foreground",
          isOffline
            ? "text-success hover:text-success/80"
            : "text-muted-foreground hover:text-foreground",
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
        disabled={!canManage}
        className="h-auto gap-1 p-0 text-destructive text-xs hover:text-destructive/80 disabled:text-muted-foreground"
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
