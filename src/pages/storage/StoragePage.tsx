import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  CheckCircle2,
  Cloud,
  Copy,
  Database,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { fetchStorageConfigurationsSnapshot } from "@/api/storage-configurations";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ConsoleTableFooter } from "@/components/common/ConsoleControls";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StorageAdapter, StorageConfigRecord, StorageStatus } from "@/types/storage";

import { storageSnapshotQueryKey } from "./api/storage-query-keys";
import { deleteStorageConfiguration } from "./api/storage-snapshot";

type StoragePageProps = {
  onCreateStorage: () => void;
  onEditStorage: (storageId: string) => void;
};

const adapterToneClass: Record<StorageAdapter, string> = {
  S3: "bg-blue-600 text-white",
};

const statusClass: Record<StorageStatus, string> = {
  已停用: "border-slate-200 bg-slate-50 text-slate-600",
  异常: "border-red-200 bg-red-50 text-red-600",
  正常: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function StoragePage({ onCreateStorage, onEditStorage }: StoragePageProps) {
  const queryClient = useQueryClient();
  const { data: snapshot } = useQuery({
    queryFn: fetchStorageConfigurationsSnapshot,
    queryKey: storageSnapshotQueryKey,
  });
  const [deleteTarget, setDeleteTarget] = useState<StorageConfigRecord | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const handleRequestDeleteStorage = useCallback((storage: StorageConfigRecord) => {
    setDeleteTarget(storage);
    setDeleteError("");
  }, []);
  const columnDefs = useMemo<ColDef<StorageConfigRecord>[]>(
    () => [
      {
        cellRenderer: StorageNameCell,
        field: "name",
        flex: 1,
        headerName: "配置名称",
        minWidth: 210,
      },
      {
        cellRenderer: OwnerCell,
        field: "owner",
        flex: 0.72,
        headerName: "负责人",
        minWidth: 110,
      },
      {
        field: "adapter",
        flex: 0.75,
        headerName: "适配器",
        minWidth: 112,
      },
      {
        cellRenderer: BucketCell,
        field: "bucket",
        flex: 1.15,
        headerName: "BUCKET",
        minWidth: 190,
      },
      {
        field: "region",
        flex: 0.75,
        headerName: "REGION",
        minWidth: 116,
      },
      {
        cellRenderer: EndpointCell,
        field: "endpoint",
        flex: 1.15,
        headerName: "ENDPOINT",
        minWidth: 210,
      },
      {
        cellRenderer: PublicBaseUrlCell,
        field: "publicBaseUrl",
        flex: 1.2,
        headerName: "PUBLIC BASE URL",
        minWidth: 210,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.55,
        headerName: "状态",
        minWidth: 86,
      },
      {
        field: "lastVerifiedAt",
        flex: 0.72,
        headerName: "最近验证",
        minWidth: 106,
      },
      {
        cellRenderer: ActionsCell,
        cellRendererParams: {
          onDeleteStorage: handleRequestDeleteStorage,
          onEditStorage,
        },
        colId: "actions",
        flex: 0.68,
        headerName: "操作",
        minWidth: 112,
        sortable: false,
      },
    ],
    [handleRequestDeleteStorage, onEditStorage],
  );

  const defaultColDef = useMemo<ColDef<StorageConfigRecord>>(
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

  if (!snapshot) {
    return <StoragePageLoading />;
  }

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-slate-500 text-xs">平台 / 存储管理</div>
            <h1 className="mt-2 font-semibold text-2xl text-slate-950 tracking-tight">存储管理</h1>
            <p className="mt-2 text-slate-600 text-sm">
              S3-Compatible 对象存储配置，统一管理 Bundle 产物上传与分发入口
            </p>
          </div>
          <Button
            type="button"
            className="shrink-0 bg-blue-600 hover:bg-blue-700"
            onClick={onCreateStorage}
          >
            <Plus className="size-4" />
            新增存储配置
          </Button>
        </div>
      </div>

      <div className="px-6 py-5">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <Database className="size-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-slate-900 text-sm">存储配置列表</h2>
                <p className="text-slate-500 text-xs">共 {snapshot.configurations.length} 条配置</p>
              </div>
            </div>
          </div>

          <AgGridReact<StorageConfigRecord>
            rowData={snapshot.configurations}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={58}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />

          <ConsoleTableFooter total={snapshot.configurations.length} />
        </section>
      </div>
      <ConfirmDialog
        isOpen={deleteTarget !== null}
        isPending={isDeleting}
        title="删除存储配置"
        description={
          deleteTarget ? `确认删除「${deleteTarget.name}」？删除后列表将不再展示该配置。` : ""
        }
        confirmLabel="删除配置"
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
            await deleteStorageConfiguration(deleteTarget.id);
            await queryClient.invalidateQueries({ queryKey: storageSnapshotQueryKey });
            setDeleteTarget(null);
          } catch (_error) {
            setDeleteError("删除存储配置失败，请稍后重试");
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

function StoragePageLoading() {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div className="text-slate-500 text-xs">平台 / 存储管理</div>
        <h1 className="mt-2 font-semibold text-2xl text-slate-950 tracking-tight">存储管理</h1>
        <p className="mt-2 text-slate-600 text-sm">
          S3-Compatible 对象存储配置，统一管理 Bundle 产物上传与分发入口
        </p>
      </div>
      <div className="px-6 py-5">
        <Card className="h-96 animate-pulse rounded-lg border-slate-200 bg-white shadow-none" />
      </div>
    </>
  );
}

function StorageNameCell({ data }: ICellRendererParams<StorageConfigRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex h-full min-w-0 items-center gap-3">
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-md shadow-sm",
          adapterToneClass[data.adapter],
        )}
      >
        <Cloud className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="truncate font-semibold text-slate-900 text-sm">{data.name}</div>
        <div className="truncate text-slate-500 text-xs">{data.id}</div>
      </div>
    </div>
  );
}

function OwnerCell({ value }: ICellRendererParams<StorageConfigRecord, string>) {
  return <span className="truncate text-slate-700 text-sm">{value || "-"}</span>;
}

function BucketCell({ value }: ICellRendererParams<StorageConfigRecord, string>) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="truncate font-mono text-slate-700 text-xs">{value}</span>
      <Button
        variant="ghost"
        type="button"
        size="icon"
        className="size-6 shrink-0 text-slate-400 hover:text-slate-700"
        aria-label="复制 Bucket"
        onClick={() => void navigator.clipboard?.writeText(value)}
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  );
}

function EndpointCell({ value }: ICellRendererParams<StorageConfigRecord, string>) {
  return <span className="truncate font-mono text-slate-600 text-xs">{value}</span>;
}

function PublicBaseUrlCell({ value }: ICellRendererParams<StorageConfigRecord, string>) {
  return <span className="truncate font-mono text-slate-600 text-xs">{value || "-"}</span>;
}

function StatusCell({ value }: ICellRendererParams<StorageConfigRecord, StorageStatus>) {
  if (!value) {
    return null;
  }

  const Icon = value === "异常" ? TriangleAlert : value === "正常" ? CheckCircle2 : RotateCw;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded border px-2 font-medium text-xs leading-none",
        statusClass[value],
      )}
    >
      <Icon className="size-3" />
      {value}
    </span>
  );
}

type ActionsCellParams = ICellRendererParams<StorageConfigRecord> & {
  onDeleteStorage?: (storage: StorageConfigRecord) => void;
  onEditStorage?: (storageId: string) => void;
};

function ActionsCell({ data, onDeleteStorage, onEditStorage }: ActionsCellParams) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex h-full items-center gap-1">
      <Button
        variant="ghost"
        type="button"
        size="icon"
        className="size-8 text-slate-500 hover:text-blue-600"
        aria-label="编辑存储配置"
        onClick={() => onEditStorage?.(data.id)}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        type="button"
        size="icon"
        className="size-8 text-slate-500 hover:text-red-600"
        aria-label="删除存储配置"
        onClick={() => onDeleteStorage?.(data)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
