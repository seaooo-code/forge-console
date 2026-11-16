import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Ban, Blocks, CirclePlay, Eye, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { BuildAdapter } from "../types";
import { formatDateTime } from "../utils";
import { BuildAdapterStatusBadge } from "./BuildAdapterStatusBadge";

export function buildBuildAdaptersColumnDefs({
  canManage,
  onOpen,
  onToggleStatus,
}: {
  canManage: boolean;
  onOpen: (adapterId: string) => void;
  onToggleStatus: (adapter: BuildAdapter) => void;
}): ColDef<BuildAdapter>[] {
  return [
    { cellRenderer: NameCell, field: "name", flex: 1.1, headerName: "名称", minWidth: 200 },
    {
      cellRenderer: DescriptionCell,
      field: "description",
      flex: 1.4,
      headerName: "描述",
      minWidth: 200,
    },
    {
      cellRenderer: ({ value }: ICellRendererParams<BuildAdapter, number>) => (
        <span className="font-mono font-semibold text-foreground text-xs">v{value}</span>
      ),
      field: "version",
      flex: 0.45,
      headerName: "版本",
      minWidth: 80,
    },
    {
      cellRenderer: ({ value }: ICellRendererParams<BuildAdapter, number>) => (
        <span className="font-semibold text-foreground text-sm">{value ?? 0}</span>
      ),
      field: "moduleCount",
      flex: 0.6,
      headerName: "引用模块数",
      minWidth: 100,
    },
    {
      cellRenderer: ({ data }: ICellRendererParams<BuildAdapter>) =>
        data ? <BuildAdapterStatusBadge status={data.status} /> : null,
      field: "status",
      flex: 0.55,
      headerName: "状态",
      minWidth: 90,
    },
    {
      cellRenderer: ({ data }: ICellRendererParams<BuildAdapter>) => (
        <span className="truncate text-foreground text-sm">
          {data?.updatedBy?.name || data?.updatedByUserId || "-"}
        </span>
      ),
      colId: "updatedBy",
      flex: 0.7,
      headerName: "更新人",
      minWidth: 110,
      sortable: false,
    },
    {
      cellRenderer: ({ value }: ICellRendererParams<BuildAdapter, string>) => (
        <span className="text-muted-foreground text-xs">{formatDateTime(value)}</span>
      ),
      field: "updatedAt",
      flex: 0.8,
      headerName: "更新时间",
      minWidth: 140,
    },
    {
      cellRenderer: ({ data }: ICellRendererParams<BuildAdapter>) =>
        data ? (
          <ActionsCell
            adapter={data}
            canManage={canManage}
            onOpen={onOpen}
            onToggleStatus={onToggleStatus}
          />
        ) : null,
      colId: "actions",
      flex: 0.6,
      headerName: "操作",
      minWidth: 100,
      sortable: false,
    },
  ];
}

function NameCell({ data }: ICellRendererParams<BuildAdapter>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex h-full min-w-0 items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Blocks className="size-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold text-primary text-sm">{data.name}</div>
        <div className="truncate font-mono text-muted-foreground text-xs">{data.id}</div>
      </div>
    </div>
  );
}

function DescriptionCell({ value }: ICellRendererParams<BuildAdapter, string>) {
  return value ? (
    <span className="truncate text-muted-foreground text-sm" title={value}>
      {value}
    </span>
  ) : (
    <span className="text-muted-foreground text-xs">-</span>
  );
}

function ActionsCell({
  adapter,
  canManage,
  onOpen,
  onToggleStatus,
}: {
  adapter: BuildAdapter;
  canManage: boolean;
  onOpen: (adapterId: string) => void;
  onToggleStatus: (adapter: BuildAdapter) => void;
}) {
  const isActive = adapter.status === "active";

  return (
    <div className="build-adapter-row-actions flex h-full items-center gap-1">
      <Button
        variant="ghost"
        type="button"
        size="icon"
        className="size-8 text-muted-foreground hover:text-primary"
        aria-label={canManage ? "编辑构建适配器" : "查看构建适配器"}
        onClick={() => onOpen(adapter.id)}
      >
        {canManage ? <Pencil className="size-4" /> : <Eye className="size-4" />}
      </Button>
      {canManage ? (
        <Button
          variant="ghost"
          type="button"
          size="icon"
          className={
            isActive
              ? "size-8 text-muted-foreground hover:text-destructive"
              : "size-8 text-muted-foreground hover:text-success"
          }
          aria-label={isActive ? "停用构建适配器" : "启用构建适配器"}
          onClick={() => onToggleStatus(adapter)}
        >
          {isActive ? <Ban className="size-4" /> : <CirclePlay className="size-4" />}
        </Button>
      ) : null}
    </div>
  );
}
