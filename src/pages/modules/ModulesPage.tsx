import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Box,
  Boxes,
  CircleDot,
  CirclePause,
  GitBranch,
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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { applicationsRootQueryKey } from "@/pages/applications";

import {
  deleteModule,
  fetchModulesSnapshot,
  modulesRootQueryKey,
  modulesSnapshotQueryKey,
} from "./api/modules-snapshot";
import { kindClass, statusClass } from "./constants";
import type { ModuleKind, ModuleListFilters, ModuleRecord, ModuleStatus } from "./types";

type ModulesPageProps = {
  onCreateModule: () => void;
  onEditModule: (moduleId: string) => void;
};

type ModuleActionsCellParams = {
  onDeleteModule: (module: ModuleRecord) => void;
  onEditModule: (moduleId: string) => void;
};

export function ModulesPage({ onCreateModule, onEditModule }: ModulesPageProps) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ModuleListFilters>({
    keyword: "",
    kind: "",
    owner: "",
    status: "",
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
  const statusOptions = useMemo(() => globalEnums?.moduleStatuses ?? [], [globalEnums]);

  const stats = useMemo(() => {
    const summary = snapshot?.summary ?? {
      active: 0,
      common: 0,
      feature: 0,
      frozen: 0,
      total: 0,
    };

    return [
      {
        detail: "已接入真实仓库",
        icon: Boxes,
        iconClass: "bg-blue-50 text-blue-600",
        id: "total",
        label: "模块总数",
        value: summary.total,
      },
      {
        detail: "依赖基础",
        icon: Layers3,
        iconClass: "bg-amber-50 text-amber-600",
        id: "common",
        label: "Common Bundle",
        value: summary.common,
      },
      {
        detail: "业务模块",
        icon: Package,
        iconClass: "bg-sky-50 text-sky-600",
        id: "feature",
        label: "Feature Bundle",
        value: summary.feature,
      },
      {
        detail: "可参与研发",
        icon: GitBranch,
        iconClass: "bg-emerald-50 text-emerald-600",
        id: "active",
        label: "活跃模块",
        value: summary.active,
      },
      {
        detail: "暂停研发",
        icon: CirclePause,
        iconClass: "bg-slate-100 text-slate-500",
        id: "frozen",
        label: "冻结模块",
        value: summary.frozen,
      },
    ];
  }, [snapshot]);

  const columnDefs = useMemo<ColDef<ModuleRecord>[]>(
    () => [
      {
        cellRenderer: CheckboxCell,
        headerComponent: CheckboxHeader,
        maxWidth: 48,
        minWidth: 48,
        pinned: "left",
        resizable: false,
        sortable: false,
        suppressHeaderMenuButton: true,
        suppressMovable: true,
      },
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
        cellRenderer: RepositoryCell,
        field: "repository",
        flex: 1.55,
        headerName: "仓库",
        minWidth: 260,
      },
      { field: "owner", flex: 0.75, headerName: "负责人", minWidth: 110 },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.55,
        headerName: "状态",
        minWidth: 86,
      },
      {
        cellRenderer: ActionsCell,
        cellRendererParams: {
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
    [onEditModule],
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
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">模块管理</h1>
          <p className="mt-2 text-slate-600 text-sm">管理 RN 模块仓库、归属应用与负责人</p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-5">
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
              <ConsoleClearableFilterSelect
                icon={CircleDot}
                label="状态"
                value={filters.status}
                options={statusOptions}
                clearLabel="清空状态筛选"
                onClear={() =>
                  setFilters((current) => ({
                    ...current,
                    status: "",
                  }))
                }
                onValueChange={(value) =>
                  setFilters((current) => ({
                    ...current,
                    status: value as ModuleListFilters["status"],
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
                className="bg-blue-600 hover:bg-blue-700"
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
        {deleteError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 text-sm">
            {deleteError}
          </div>
        ) : null}
      </ConfirmDialog>
    </>
  );
}

function CheckboxHeader() {
  return <Checkbox aria-label="选择全部模块" />;
}

function CheckboxCell() {
  return (
    <div className="flex h-full items-center">
      <Checkbox aria-label="选择模块" />
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
          data.kind === "Common" ? "bg-amber-100 text-amber-600" : "bg-sky-100 text-sky-600",
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold text-slate-900">{data.name}</div>
        <div className="text-slate-500 text-xs">{data.kind} Bundle</div>
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
      <GitFork className="size-3.5 shrink-0 text-slate-400" />
      <span className="truncate font-mono text-slate-600 text-xs">{value}</span>
    </div>
  );
}

function StatusCell({ value }: ICellRendererParams<ModuleRecord, ModuleStatus>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-medium text-xs leading-none",
        statusClass[value],
      )}
    >
      {value}
    </span>
  );
}

function ActionsCell({
  data,
  onDeleteModule,
  onEditModule,
}: ICellRendererParams<ModuleRecord> & ModuleActionsCellParams) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex h-full items-center gap-2 whitespace-nowrap font-medium text-blue-600 text-xs">
      <Button
        variant="link"
        type="button"
        className="h-auto gap-1 p-0 text-blue-600 text-xs hover:text-blue-700"
        onClick={() => onEditModule(data.id)}
      >
        <Pencil className="size-3.5" />
        编辑
      </Button>
      <Button
        variant="link"
        type="button"
        className="h-auto gap-1 p-0 text-rose-600 text-xs hover:text-rose-700"
        onClick={() => onDeleteModule(data)}
      >
        <Trash2 className="size-3.5" />
        删除
      </Button>
    </div>
  );
}
