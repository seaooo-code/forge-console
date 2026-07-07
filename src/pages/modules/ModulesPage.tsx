import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Box, Boxes, GitFork, Layers3, Package, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { fetchGlobalEnums, globalEnumsQueryKey } from "@/api/enums";
import { searchFeishuUsers } from "@/api/feishu-user-search";
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
import { cn } from "@/lib/utils";
import { applicationsRootQueryKey } from "@/pages/applications";
import { useAuthStore } from "@/store/use-auth-store";

import {
  deleteModule,
  fetchModulesSnapshot,
  modulesRootQueryKey,
  modulesSnapshotQueryKey,
} from "./api/modules-snapshot";
import { kindClass } from "./constants";
import type { ModuleKind, ModuleListFilters, ModuleRecord } from "./types";

const PAGE_SIZE = 20;

type ModulesPageProps = {
  onCreateModule: () => void;
  onEditModule: (moduleId: string) => void;
  onOpenModule: (moduleId: string) => void;
};

type ModuleActionsCellParams = {
  canManageModules: boolean;
  onDeleteModule: (module: ModuleRecord) => void;
  onEditModule: (moduleId: string) => void;
};

export function ModulesPage({ onCreateModule, onEditModule, onOpenModule }: ModulesPageProps) {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const canManageModules = Boolean(session?.capabilities.canManageModules);
  const [filters, setFilters] = useState<ModuleListFilters>({
    applicationId: "",
    keyword: "",
    kind: "",
    owner: "",
  });
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ModuleRecord | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { data: snapshot } = useQuery({
    queryFn: () => fetchModulesSnapshot(filters),
    queryKey: modulesSnapshotQueryKey(filters),
  });
  const { data: globalEnums } = useQuery({
    queryFn: fetchGlobalEnums,
    queryKey: globalEnumsQueryKey,
  });

  const kindOptions = useMemo(() => globalEnums?.moduleKinds ?? [], [globalEnums]);

  const stats = useMemo(() => {
    const summary = snapshot?.summary ?? {
      common: 0,
      feature: 0,
      total: 0,
    };

    return [
      {
        detail: "已接入真实仓库",
        icon: Boxes,
        iconClass: "bg-info/10 text-info",
        id: "total",
        label: "模块总数",
        tone: "info" as const,
        value: summary.total,
      },
      {
        detail: "依赖基础",
        icon: Layers3,
        iconClass: "bg-warning/10 text-warning",
        id: "common",
        label: "通用模块",
        tone: "warning" as const,
        value: summary.common,
      },
      {
        detail: "业务模块",
        icon: Package,
        iconClass: "bg-info/10 text-info",
        id: "feature",
        label: "功能模块",
        tone: "info" as const,
        value: summary.feature,
      },
    ];
  }, [snapshot]);

  const columnDefs = useMemo<ColDef<ModuleRecord>[]>(
    () => [
      {
        cellRenderer: ModuleCell,
        field: "name",
        flex: 1.05,
        headerName: "模块",
        minWidth: 190,
      },
      {
        cellRenderer: KindCell,
        field: "kind",
        flex: 0.7,
        headerName: "类型",
        minWidth: 110,
      },
      {
        field: "applicationName",
        flex: 0.8,
        headerName: "关联应用",
        minWidth: 130,
      },
      {
        cellRenderer: CommonModuleCell,
        field: "commonModuleName",
        flex: 0.8,
        headerName: "通用模块",
        minWidth: 130,
      },
      {
        cellRenderer: RepositoryCell,
        field: "repository",
        flex: 1.55,
        headerName: "仓库",
        minWidth: 260,
      },
      { field: "owner", flex: 0.75, headerName: "负责人", minWidth: 110 },
      {
        cellRenderer: ActionsCell,
        cellRendererParams: {
          canManageModules,
          onDeleteModule: setDeleteTarget,
          onEditModule,
        },
        colId: "actions",
        flex: 0.9,
        headerName: "操作",
        minWidth: 150,
        sortable: false,
      },
    ],
    [canManageModules, onEditModule],
  );

  const modules = snapshot?.modules ?? [];
  const updateFilters = (patch: Partial<ModuleListFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="模块管理" description="管理模块仓库、归属应用、负责人和模块关系" />

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
          </>
        }
        search={
          <ConsoleSearchInput
            value={filters.keyword}
            placeholder="搜索模块 / 仓库 / 应用"
            onChange={(keyword) => updateFilters({ keyword })}
          />
        }
        actions={
          <Button size="sm" disabled={!canManageModules} onClick={onCreateModule}>
            <Plus className="size-4" />
            新建模块
          </Button>
        }
      />

      <DataTable
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

      <Card className="rounded-xl border-border bg-card py-0 shadow-xs">
        <TablePagination
          page={page}
          pageSize={PAGE_SIZE}
          total={modules.length}
          onPageChange={setPage}
          onPageSizeChange={() => {
            // hook left here for future wiring; current snapshot returns the full list
          }}
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

function ModuleCell({ data }: ICellRendererParams<ModuleRecord>) {
  if (!data) {
    return null;
  }

  const Icon = data.kind === "Common" ? Box : Package;

  return (
    <div className="flex h-full items-center gap-3">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md shadow-sm",
          data.kind === "Common" ? "bg-warning/10 text-warning" : "bg-info/10 text-info",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold text-foreground">{data.name}</div>
        <div className="text-muted-foreground text-xs">
          {data.kind === "Common" ? "通用模块" : "功能模块"}
        </div>
      </div>
    </div>
  );
}

function KindCell({ value }: ICellRendererParams<ModuleRecord, ModuleRecord["kind"]>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        kindClass[value],
      )}
    >
      {value}
    </span>
  );
}

function RepositoryCell({ value }: ICellRendererParams<ModuleRecord, string>) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <GitFork className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate font-mono text-muted-foreground text-xs">{value}</span>
    </div>
  );
}

function CommonModuleCell({ data }: ICellRendererParams<ModuleRecord>) {
  if (!data || data.kind === "Common") {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  return (
    <span className="truncate text-foreground text-sm">
      {data.commonModuleName || data.commonModuleId || "-"}
    </span>
  );
}

function ActionsCell({
  canManageModules,
  data,
  onDeleteModule,
  onEditModule,
}: ICellRendererParams<ModuleRecord> & ModuleActionsCellParams) {
  if (!data) {
    return null;
  }

  return (
    <div
      className="flex h-full items-center gap-2 whitespace-nowrap font-medium text-primary text-xs"
      data-module-row-action="true"
    >
      <Button
        variant="link"
        type="button"
        disabled={!canManageModules}
        className="h-auto gap-1 p-0 text-primary text-xs hover:text-primary/80 disabled:text-muted-foreground"
        onClick={(event) => {
          event.stopPropagation();
          onEditModule(data.id);
        }}
      >
        <Pencil className="size-3.5" />
        编辑
      </Button>
      <Button
        variant="link"
        type="button"
        disabled={!canManageModules}
        className="h-auto gap-1 p-0 text-destructive text-xs hover:text-destructive/80 disabled:text-muted-foreground"
        onClick={(event) => {
          event.stopPropagation();
          onDeleteModule(data);
        }}
      >
        <Trash2 className="size-3.5" />
        删除
      </Button>
    </div>
  );
}
