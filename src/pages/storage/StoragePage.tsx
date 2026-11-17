import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import {
  CheckCircle2,
  Cloud,
  Copy,
  Pencil,
  Plus,
  RotateCw,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchStorageConfigurationsSnapshot } from "@/api/storage-configurations";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DataTable, FilterBar, PageHeader, TablePagination } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePagination } from "@/hooks/use-pagination";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";
import type { StorageConfigRecord, StorageStatus } from "@/types/storage";

import { storagePageQueryKey, storageSnapshotQueryKey } from "./api/storage-query-keys";
import { deleteStorageConfiguration } from "./api/storage-snapshot";
import { adapterToneClass, statusClass, statusLabel } from "./constants";

type StoragePageProps = {
  onCreateStorage: () => void;
  onEditStorage: (storageId: string) => void;
};

export function StoragePage({ onCreateStorage, onEditStorage }: StoragePageProps) {
  const queryClient = useQueryClient();
  const session = useAuthStore((state) => state.session);
  const canManageStorage = Boolean(session?.capabilities.canManageStorage);
  const { clampPage, page, pageSize, setPage, setPageSize } = usePagination();
  const { data: snapshot } = useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchStorageConfigurationsSnapshot({ page, pageSize }),
    queryKey: storagePageQueryKey({ page, pageSize }),
  });
  const [deleteTarget, setDeleteTarget] = useState<StorageConfigRecord | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const handleRequestDeleteStorage = useCallback((storage: StorageConfigRecord) => {
    setDeleteTarget(storage);
    setDeleteError("");
  }, []);
  useEffect(() => {
    if (snapshot) {
      clampPage(snapshot.pagination.total);
    }
  }, [clampPage, snapshot]);
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
          canManageStorage,
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
    [canManageStorage, handleRequestDeleteStorage, onEditStorage],
  );

  if (!snapshot) {
    return <StoragePageLoading />;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <StorageHeader />

        <FilterBar
          label="存储配置列表"
          actions={
            <>
              <span className="text-muted-foreground text-xs">
                共{" "}
                <span className="font-semibold text-foreground">{snapshot.pagination.total}</span>{" "}
                条配置
              </span>
              <Button
                type="button"
                size="sm"
                disabled={!canManageStorage}
                onClick={onCreateStorage}
              >
                <Plus className="size-4" />
                新增存储配置
              </Button>
            </>
          }
        />

        <DataTable
          rows={snapshot.configurations}
          columnDefs={columnDefs}
          getRowId={({ data }) => data.id}
        />

        <Card className="rounded-xl bg-card py-0">
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={snapshot.pagination.total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </Card>
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
        {deleteError ? <Alert variant="danger">{deleteError}</Alert> : null}
      </ConfirmDialog>
    </>
  );
}

function StoragePageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <StorageHeader />
      <Card className="h-96 animate-pulse rounded-xl bg-card" />
    </div>
  );
}

function StorageHeader() {
  return (
    <PageHeader
      title="存储管理"
      description="S3-Compatible 对象存储配置，统一管理 Bundle 产物上传与分发入口"
    />
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
          "flex size-8 shrink-0 items-center justify-center rounded-md",
          adapterToneClass[data.adapter],
        )}
      >
        <Cloud className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="truncate font-semibold text-foreground text-sm">{data.name}</div>
        <div className="truncate text-muted-foreground text-xs">{data.id}</div>
      </div>
    </div>
  );
}

function OwnerCell({ value }: ICellRendererParams<StorageConfigRecord, string>) {
  return <span className="truncate text-foreground text-sm">{value || "-"}</span>;
}

function BucketCell({ value }: ICellRendererParams<StorageConfigRecord, string>) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="truncate font-mono text-foreground text-xs">{value}</span>
      <Button
        variant="ghost"
        type="button"
        size="icon"
        className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
        aria-label="复制 Bucket"
        onClick={() => void navigator.clipboard?.writeText(value)}
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  );
}

function EndpointCell({ value }: ICellRendererParams<StorageConfigRecord, string>) {
  return <span className="truncate font-mono text-muted-foreground text-xs">{value}</span>;
}

function PublicBaseUrlCell({ value }: ICellRendererParams<StorageConfigRecord, string>) {
  return <span className="truncate font-mono text-muted-foreground text-xs">{value || "-"}</span>;
}

function StatusCell({ value }: ICellRendererParams<StorageConfigRecord, StorageStatus>) {
  if (!value) {
    return null;
  }

  const Icon = value === "error" ? TriangleAlert : value === "healthy" ? CheckCircle2 : RotateCw;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-md px-2 font-medium text-xs leading-none",
        statusClass[value],
      )}
    >
      <Icon className="size-3" />
      {statusLabel[value]}
    </span>
  );
}

type ActionsCellParams = ICellRendererParams<StorageConfigRecord> & {
  canManageStorage?: boolean;
  onDeleteStorage?: (storage: StorageConfigRecord) => void;
  onEditStorage?: (storageId: string) => void;
};

function ActionsCell({
  canManageStorage,
  data,
  onDeleteStorage,
  onEditStorage,
}: ActionsCellParams) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex h-full items-center gap-1">
      <Button
        variant="ghost"
        type="button"
        size="icon"
        className="size-8 text-muted-foreground hover:text-primary"
        aria-label="编辑存储配置"
        disabled={!canManageStorage}
        onClick={() => onEditStorage?.(data.id)}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        type="button"
        size="icon"
        className="size-8 text-muted-foreground hover:text-destructive"
        aria-label="删除存储配置"
        disabled={!canManageStorage}
        onClick={() => onDeleteStorage?.(data)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
