import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { searchFeishuUsers } from "@/api/feishu-user-search";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ConsoleOwnerSearchFilter, ConsoleSearchInput } from "@/components/common/ConsoleControls";
import {
  DataTable,
  ErrorMessage,
  FilterBar,
  ListHeader,
  SummaryStats,
  TablePagination,
} from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";
import { applicationsRootQueryKey } from "@/pages/applications";
import { useApplicationScopeStore } from "@/store/use-application-scope-store";
import { useAuthStore } from "@/store/use-auth-store";

import {
  deleteModule,
  fetchModulesSnapshot,
  modulesRootQueryKey,
  modulesSnapshotQueryKey,
} from "./api/modules-snapshot";
import { buildModuleColumns } from "./components/ModulesTableCells";
import type { ModuleKind, ModuleListFilters, ModuleRecord } from "./types";

type ModulesPageProps = {
  onCreateModule: () => void;
  onEditModule: (moduleId: string) => void;
  onOpenModule: (moduleId: string) => void;
};

export function ModulesPage({ onCreateModule, onEditModule, onOpenModule }: ModulesPageProps) {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const storedApplicationId = useApplicationScopeStore((state) => state.applicationId);
  const setStoredApplicationId = useApplicationScopeStore((state) => state.setApplicationId);
  const initialApplicationId = searchParams.get("applicationId")?.trim() || storedApplicationId;
  const session = useAuthStore((state) => state.session);
  const canManageModules = Boolean(session?.capabilities.canManageModules);
  const [filters, setFilters] = useState<ModuleListFilters>({
    applicationId: initialApplicationId,
    keyword: "",
    kind: "",
    owner: "",
  });
  const { clampPage, page, pageSize, resetPage, setPage, setPageSize } = usePagination();
  const [deleteTarget, setDeleteTarget] = useState<ModuleRecord | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    data: snapshot,
    error,
    isFetching,
    refetch,
  } = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchModulesSnapshot({ ...filters, page, pageSize }),
    queryKey: modulesSnapshotQueryKey({ ...filters, page, pageSize }),
  });

  useEffect(() => {
    const queryApplicationId = searchParams.get("applicationId")?.trim() ?? "";
    const nextApplicationId = queryApplicationId || storedApplicationId;

    setFilters((current) =>
      current.applicationId === nextApplicationId
        ? current
        : { ...current, applicationId: nextApplicationId },
    );
    resetPage();
    setStoredApplicationId(nextApplicationId);
  }, [resetPage, searchParams, setStoredApplicationId, storedApplicationId]);

  useEffect(() => {
    if (snapshot) {
      clampPage(snapshot.pagination.total);
    }
  }, [clampPage, snapshot]);

  const columnDefs = useMemo(
    () =>
      buildModuleColumns({
        canManageModules,
        onDeleteModule: setDeleteTarget,
        onEditModule,
      }),
    [canManageModules, onEditModule],
  );

  const modules = snapshot?.modules ?? [];
  const updateFilters = (patch: Partial<ModuleListFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    resetPage();
  };

  return (
    <div className="flex flex-col gap-5">
      <ListHeader
        title="模块"
        summary={
          <SummaryStats
            activeId={filters.kind}
            items={[
              { id: "", label: "全部", value: snapshot?.summary.total ?? "-" },
              {
                id: "Common",
                label: "通用模块",
                tone: "warning",
                value: snapshot?.summary.common ?? "-",
              },
              {
                id: "Feature",
                label: "功能模块",
                tone: "info",
                value: snapshot?.summary.feature ?? "-",
              },
            ]}
            onSelect={(kind) => updateFilters({ kind: kind as ModuleKind | "" })}
          />
        }
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="刷新模块列表"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              <RefreshCw className={cn(isFetching && "animate-spin")} />
            </Button>
            <Button disabled={!canManageModules} onClick={onCreateModule}>
              <Plus />
              新建模块
            </Button>
          </>
        }
      />

      <FilterBar
        primary={
          <>
            <ConsoleOwnerSearchFilter
              value={filters.owner}
              searchUsers={searchFeishuUsers}
              onValueChange={(owner) => updateFilters({ owner })}
            />
            <ConsoleSearchInput
              value={filters.keyword}
              placeholder="搜索模块 / 仓库 / 应用"
              onChange={(keyword) => updateFilters({ keyword })}
            />
          </>
        }
      />

      {error && !snapshot ? (
        <ErrorMessage error={error} onRetry={() => void refetch()} />
      ) : !snapshot ? (
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      ) : (
        <div className="overflow-hidden rounded-xl bg-card shadow-edge">
          <DataTable
            className="rounded-none shadow-none"
            rows={modules}
            columnDefs={columnDefs}
            getRowId={({ data }) => data.id}
            rowActionSelector="[data-module-row-action]"
            onRowClicked={(event) => {
              if (event.data) {
                onOpenModule(event.data.id);
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
      )}

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        isPending={isDeleting}
        title="删除模块"
        description={
          deleteTarget ? `确认删除「${deleteTarget.name}」？删除后应用关联模块数会同步更新。` : ""
        }
        confirmLabel="删除模块"
        tone="danger"
        onCancel={() => {
          if (isDeleting) {
            return;
          }
          setDeleteTarget(null);
          setDeleteError("");
        }}
        onConfirm={async () => {
          if (!deleteTarget) {
            return;
          }

          setIsDeleting(true);
          setDeleteError("");
          try {
            await deleteModule(deleteTarget.id);
            await queryClient.invalidateQueries({ queryKey: modulesRootQueryKey });
            await queryClient.invalidateQueries({ queryKey: applicationsRootQueryKey });
            setDeleteTarget(null);
          } catch (error) {
            setDeleteError(error instanceof Error ? error.message : "删除模块失败，请稍后重试");
          } finally {
            setIsDeleting(false);
          }
        }}
      >
        {deleteError ? <Alert variant="danger">{deleteError}</Alert> : null}
      </ConfirmDialog>
    </div>
  );
}
