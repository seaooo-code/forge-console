import { useQueryClient } from "@tanstack/react-query";
import { MonitorSmartphone, Plus, RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { searchFeishuUsers } from "@/api/feishu-user-search";
import {
  ConsoleClearableFilterSelect,
  ConsoleOwnerSearchFilter,
  ConsoleSearchInput,
} from "@/components/common/ConsoleControls";
import {
  DataTable,
  ErrorMessage,
  FilterBar,
  ListHeader,
  SummaryStats,
  TablePagination,
} from "@/components/layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

import { applicationsRootQueryKey } from "./api/application-list-filters";
import { deleteApplication, updateApplicationStatus } from "./api/applications-snapshot";
import { ApplicationDeleteDialog } from "./components/ApplicationDeleteDialog";
import { ApplicationStatusDialog } from "./components/ApplicationStatusDialog";
import { buildApplicationColumnDefs } from "./components/ApplicationsGridColumns";
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

  const header = (
    <ListHeader
      title="应用"
      summary={
        <SummaryStats
          activeId={filters.status}
          items={[
            { id: "", label: "全部", value: snapshot?.summary.total ?? "-" },
            {
              id: "running",
              label: "运行中",
              tone: "success",
              value: snapshot?.summary.running ?? "-",
            },
            {
              id: "maintenance",
              label: "维护中",
              tone: "warning",
              value: snapshot?.summary.maintenance ?? "-",
            },
            { id: "offline", label: "已下线", value: snapshot?.summary.offline ?? "-" },
          ]}
          onSelect={(status) => updateFilters({ status: status as ApplicationStatusCode | "" })}
        />
      }
      actions={
        <>
          <Button
            variant="outline"
            size="icon"
            aria-label="刷新应用列表"
            disabled={isFetching}
            onClick={() => {
              void refetch();
            }}
          >
            <RefreshCw className={cn(isFetching && "animate-spin")} />
          </Button>
          <Button disabled={!canCreateApplication} onClick={onCreateApplication}>
            <Plus />
            新建应用
          </Button>
        </>
      }
    />
  );

  if (isError && !snapshot) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <ErrorMessage error={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="flex flex-col gap-5">
        {header}
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const { applications } = snapshot;
  const nextStatus: ApplicationStatusCode =
    statusActionTarget?.status === "已下线" ? "running" : "offline";

  return (
    <div className="flex flex-col gap-5">
      {header}

      <FilterBar
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
      />

      <div className="overflow-hidden rounded-xl bg-card shadow-edge">
        <DataTable
          className="rounded-none shadow-none"
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
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={snapshot.pagination.total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

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
