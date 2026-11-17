import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Box, GitFork, Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { kindClass } from "../constants";
import type { ModuleRecord } from "../types";

type ModuleActionsCellParams = {
  canManageModules: boolean;
  onDeleteModule: (module: ModuleRecord) => void;
  onEditModule: (moduleId: string) => void;
};

type BuildModuleColumnsParams = ModuleActionsCellParams;

export function buildModuleColumns({
  canManageModules,
  onDeleteModule,
  onEditModule,
}: BuildModuleColumnsParams): ColDef<ModuleRecord>[] {
  return [
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
        onDeleteModule,
        onEditModule,
      },
      colId: "actions",
      flex: 0.9,
      headerName: "操作",
      minWidth: 150,
      sortable: false,
    },
  ];
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
          "flex size-8 shrink-0 items-center justify-center rounded-md",
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
        "inline-flex h-6 items-center rounded-md px-2 font-semibold text-xs leading-none",
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
