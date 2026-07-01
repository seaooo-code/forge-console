import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Box,
  Boxes,
  GitFork,
  Layers3,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { fetchGlobalEnums, globalEnumsQueryKey } from "@/api/enums";
import { searchFeishuUsers } from "@/api/feishu-user-search";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  ConsoleClearableFilterSelect,
  ConsoleOwnerSearchFilter,
  ConsoleSearchInput,
  ConsoleTableFooter,
} from "@/components/common/ConsoleControls";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
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
  const [deleteTarget, setDeleteTarget] = useState<ModuleRecord | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    data: snapshot,
    isFetching,
    refetch,
  } = useQuery({
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
        value: summary.total,
      },
      {
        detail: "依赖基础",
        icon: Layers3,
        iconClass: "bg-warning/10 text-warning",
        id: "common",
        label: "通用模块",
        value: summary.common,
      },
      {
        detail: "业务模块",
        icon: Package,
        iconClass: "bg-info/10 text-info",
        id: "feature",
        label: "功能模块",
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

  const defaultColDef = useMemo<ColDef<ModuleRecord>>(
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

  const modules = snapshot?.modules ?? [];

  return (
    <>
      <div className="border-border border-b bg-card px-6 py-5">
        <div>
          <h1 className="font-semibold text-2xl text-foreground tracking-tight">模块管理</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            管理模块仓库、归属应用、负责人和模块关系
          </p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-3">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.id} className="rounded-lg px-5 py-4 shadow-none">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="font-medium text-muted-foreground text-sm">{item.label}</div>
                    <div className="font-semibold text-3xl text-foreground leading-none">
                      {item.value}
                    </div>
                    <div className="font-medium text-muted-foreground text-xs">{item.detail}</div>
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

        <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-border border-b px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ConsoleClearableFilterSelect
                icon={Boxes}
                label="类型"
                value={filters.kind}
                options={kindOptions}
                clearLabel="清空类型筛选"
                onClear={() =>
                  setFilters((current) => ({
                    ...current,
                    kind: "",
                  }))
                }
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    kind: value as ModuleKind,
                  }))
                }
              />
              <ConsoleOwnerSearchFilter
                value={filters.owner}
                searchUsers={searchFeishuUsers}
                onValueChange={(owner) =>
                  setFilters((current) => ({
                    ...current,
                    owner,
                  }))
                }
              />
              <ConsoleSearchInput
                value={filters.keyword}
                placeholder="搜索模块 / 仓库 / 应用"
                onChange={(keyword) => setFilters((current) => ({ ...current, keyword }))}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="刷新模块列表"
                onClick={() => {
                  void refetch();
                }}
              >
                <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
              </Button>
              <Button
                type="button"
                className="bg-primary hover:bg-primary/90"
                disabled={!canManageModules}
                onClick={onCreateModule}
              >
                <Plus className="size-4" />
                新建模块
              </Button>
            </div>
          </div>

          <AgGridReact<ModuleRecord>
            rowData={modules}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={64}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
            rowClass="cursor-pointer"
            onRowClicked={({ data }) => {
              if (data) {
                onOpenModule(data.id);
              }
            }}
          />

          <ConsoleTableFooter total={modules.length} />
        </section>
      </div>

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
    </>
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
    <div className="flex h-full items-center gap-2 whitespace-nowrap font-medium text-primary text-xs">
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
