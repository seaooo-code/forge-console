import { useQueryClient } from "@tanstack/react-query";
import { AppWindow, CircleDot, MonitorSmartphone, Plus, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { searchFeishuUsers } from "@/api/feishu-user-search";
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/use-auth-store";

import { applicationsRootQueryKey } from "./api/application-list-filters";
import { deleteApplication, updateApplicationStatus } from "./api/applications-snapshot";
import { ApplicationDeleteDialog } from "./components/ApplicationDeleteDialog";
import { ApplicationStatusDialog } from "./components/ApplicationStatusDialog";
import { buildApplicationColumnDefs } from "./components/ApplicationsGridColumns";
import { ApplicationsPageLoading } from "./components/ApplicationsPageLoading";
import { useApplicationDeleteCheck, useApplicationsListState } from "./hooks";
import type { ApplicationStatusCode, HostApplication } from "./types";

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
  const {
    error,
    filters,
    isError,
    isFetching,
    keywordInput,
    page,
    pageSize,
    platformFilterOptions,
    refetch,
    setKeywordInput,
    setPage,
    setPageSize,
    snapshot,
    stats,
    statusFilterOptions,
    updateFilters,
  } = useApplicationsListState();
  const [statusActionTarget, setStatusActionTarget] = useState<HostApplication | null>(null);
  const [statusActionError, setStatusActionError] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HostApplication | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    data: deleteCheck,
    isError: isDeleteCheckError,
    isFetching: isCheckingDelete,
  } = useApplicationDeleteCheck(deleteTarget?.slug);

  const handleRequestUpdateApplicationStatus = useCallback((application: HostApplication) => {
    setStatusActionTarget(application);
    setStatusActionError("");
  }, []);
  const handleRequestDeleteApplication = useCallback((application: HostApplication) => {
    setDeleteTarget(application);
    setDeleteError("");
  }, []);

  const columnDefs = useMemo(
    () =>
      buildApplicationColumnDefs({
        canManageApplications,
        onConfigureApplication,
        onRequestDeleteApplication: handleRequestDeleteApplication,
        onRequestUpdateApplicationStatus: handleRequestUpdateApplicationStatus,
      }),
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

      <ApplicationStatusDialog
        isPending={isUpdatingStatus}
        statusActionError={statusActionError}
        target={statusActionTarget}
        onCancel={() => {
          if (isUpdatingStatus) {
            return;
          }
          setStatusActionTarget(null);
          setStatusActionError("");
        }}
        onConfirm={() => {
          void (async () => {
            if (!statusActionTarget) {
              return;
            }

            const statusActionLabel = statusActionTarget.status === "已下线" ? "上线" : "下线";
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
          })();
        }}
      />
      <ApplicationDeleteDialog
        deleteCheck={deleteCheck}
        deleteError={deleteError}
        isCheckingDelete={isCheckingDelete}
        isDeleteCheckError={isDeleteCheckError}
        isPending={isDeleting}
        target={deleteTarget}
        onCancel={() => {
          if (isDeleting) {
            return;
          }
          setDeleteTarget(null);
          setDeleteError("");
        }}
        onConfirm={() => {
          void (async () => {
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
          })();
        }}
      />
    </div>
  );
}
