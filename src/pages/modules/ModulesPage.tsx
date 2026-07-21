import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Plus, RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { fetchGlobalEnums, globalEnumsQueryKey } from "@/api/enums";
import { searchFeishuUsers } from "@/api/feishu-user-search";
import { ApplicationScopeSelect } from "@/components/common/ApplicationScopeSelect";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  ConsoleClearableFilterSelect,
  ConsoleOwnerSearchFilter,
  ConsoleSearchInput,
} from "@/components/common/ConsoleControls";
import { DataTable, FilterBar, KpiCard, PageHeader, TablePagination } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePagination } from "@/hooks/use-pagination";
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
import { buildModuleStats } from "./utils";

type ModulesPageProps = {
  onCreateModule: () => void;
  onEditModule: (moduleId: string) => void;
  onOpenModule: (moduleId: string) => void;
};

export function ModulesPage({ onCreateModule, onEditModule, onOpenModule }: ModulesPageProps) {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
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
    isFetching,
    refetch,
  } = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchModulesSnapshot({ ...filters, page, pageSize }),
    queryKey: modulesSnapshotQueryKey({ ...filters, page, pageSize }),
  });
  const { data: globalEnums } = useQuery({
    queryFn: fetchGlobalEnums,
    queryKey: globalEnumsQueryKey,
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

  const kindOptions = useMemo(() => globalEnums?.moduleKinds ?? [], [globalEnums]);

  const stats = useMemo(() => buildModuleStats(snapshot), [snapshot]);

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
  const updateApplicationScope = (applicationId: string) => {
    const normalizedApplicationId = applicationId.trim();
    setStoredApplicationId(normalizedApplicationId);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      if (normalizedApplicationId) {
        next.set("applicationId", normalizedApplicationId);
      } else {
        next.delete("applicationId");
      }
      return next;
    });
    updateFilters({ applicationId: normalizedApplicationId });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="模块管理"
        description="管理模块仓库、归属应用、负责人和模块关系"
        below={
          <div className="flex flex-wrap items-center gap-2">
            <ApplicationScopeSelect
              value={filters.applicationId}
              onValueChange={updateApplicationScope}
            />
          </div>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        {stats.map((item) => (
          <KpiCard
            key={item.id}
            icon={item.icon}
            label={item.label}
            value={item.value}
            detail={item.detail}
            tone={item.tone}
            toneClassName={item.iconClass}
          />
        ))}
      </section>

      <FilterBar
        label="筛选"
        primary={
          <>
            <ConsoleClearableFilterSelect
              icon={Boxes}
              label="类型"
              value={filters.kind}
              options={kindOptions}
              clearLabel="清空类型筛选"
              onClear={() => updateFilters({ kind: "" })}
              onValueChange={(value) => updateFilters({ kind: value as ModuleKind })}
            />
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
        actions={
          <>
            <Button size="sm" disabled={!canManageModules} onClick={onCreateModule}>
              <Plus className="size-4" />
              新建模块
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="刷新模块列表"
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
        rows={modules}
        columnDefs={columnDefs}
        getRowId={({ data }) => data.id}
        loading={isFetching}
        rowActionSelector="[data-module-row-action]"
        onRowClicked={(event) => {
          if (event.data) {
            onOpenModule(event.data.id);
          }
        }}
      />

      <Card className="rounded-xl border-border bg-card py-0 shadow-xs">
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={snapshot?.pagination.total ?? 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>

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
