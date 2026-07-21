import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Activity, ArchiveX, Smartphone, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { applicationStatusClass } from "../constants";
import type { HostApplication } from "../types";

export function AppNameCell({ data }: ICellRendererParams<HostApplication>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex h-full items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
        <Smartphone className="size-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold text-foreground">{data.name}</div>
        <div className="font-mono text-muted-foreground text-xs">{data.slug}</div>
      </div>
    </div>
  );
}

export function StatusCell({
  value,
}: ICellRendererParams<HostApplication, HostApplication["status"]>) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex h-full items-center">
      <span
        className={cn(
          "inline-flex h-6 items-center rounded border px-2 font-medium text-xs leading-none",
          applicationStatusClass[value],
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function OwnerCell({ data }: ICellRendererParams<HostApplication>) {
  if (!data) {
    return null;
  }

  const owner = data.owner;

  return (
    <div className="flex h-full min-w-0 items-center gap-2">
      <OwnerAvatar name={owner} src={data.ownerAvatarUrl} />
      <div className="min-w-0">
        <div className="truncate font-medium text-foreground text-sm">{owner}</div>
        {data.ownerEmail ? (
          <div className="truncate text-muted-foreground text-xs">{data.ownerEmail}</div>
        ) : null}
      </div>
    </div>
  );
}

function OwnerAvatar({ name, src }: { name: string; src: string }) {
  if (src) {
    return <img src={src} alt={name} className="size-7 shrink-0 rounded-full object-cover" />;
  }

  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function ActionsCell({
  canManage,
  data,
  onConfigureApplication,
  onDeleteApplication,
  onUpdateApplicationStatus,
}: ICellRendererParams<HostApplication> & {
  canManage?: boolean;
  onConfigureApplication?: (applicationSlug: string) => void;
  onDeleteApplication?: (application: HostApplication) => void;
  onUpdateApplicationStatus?: (application: HostApplication) => void;
}) {
  const isOffline = data?.status === "已下线";
  const StatusActionIcon = isOffline ? Activity : ArchiveX;

  return (
    <div
      className="flex h-full items-center gap-2 whitespace-nowrap font-medium text-xs"
      data-application-row-action="true"
    >
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-primary text-xs hover:text-primary/80"
        onClick={() => {
          if (data) {
            onConfigureApplication?.(data.slug);
          }
        }}
      >
        配置
      </Button>
      <Button
        variant="link"
        type="button"
        disabled={!canManage}
        className={cn(
          "h-auto gap-1 p-0 text-xs disabled:text-muted-foreground",
          isOffline
            ? "text-success hover:text-success/80"
            : "text-muted-foreground hover:text-foreground",
        )}
        onClick={() => {
          if (data) {
            onUpdateApplicationStatus?.(data);
          }
        }}
      >
        <StatusActionIcon className="size-3.5" />
        {isOffline ? "上线" : "下线"}
      </Button>
      <Button
        variant="link"
        type="button"
        disabled={!canManage}
        className="h-auto gap-1 p-0 text-destructive text-xs hover:text-destructive/80 disabled:text-muted-foreground"
        onClick={() => {
          if (data) {
            onDeleteApplication?.(data);
          }
        }}
      >
        <Trash2 className="size-3.5" />
        删除
      </Button>
    </div>
  );
}

export type BuildApplicationColumnDefsOptions = {
  canManageApplications: boolean;
  onConfigureApplication: (applicationSlug: string) => void;
  onRequestDeleteApplication: (application: HostApplication) => void;
  onRequestUpdateApplicationStatus: (application: HostApplication) => void;
};

export function buildApplicationColumnDefs({
  canManageApplications,
  onConfigureApplication,
  onRequestDeleteApplication,
  onRequestUpdateApplicationStatus,
}: BuildApplicationColumnDefsOptions): ColDef<HostApplication>[] {
  return [
    {
      cellRenderer: AppNameCell,
      field: "name",
      flex: 1.6,
      headerName: "应用",
      minWidth: 280,
    },
    {
      field: "platform",
      flex: 1.05,
      headerName: "平台",
      minWidth: 180,
    },
    {
      cellRenderer: OwnerCell,
      field: "owner",
      flex: 0.9,
      headerName: "负责人",
      minWidth: 180,
    },
    {
      field: "moduleCount",
      flex: 0.5,
      headerName: "模块",
      minWidth: 80,
    },
    {
      field: "environmentCount",
      flex: 0.5,
      headerName: "环境",
      minWidth: 80,
    },
    {
      field: "createdAt",
      flex: 0.8,
      headerName: "创建时间",
      minWidth: 130,
    },
    {
      cellRenderer: StatusCell,
      field: "status",
      flex: 0.7,
      headerName: "状态",
      minWidth: 112,
    },
    {
      cellRenderer: ActionsCell,
      cellRendererParams: {
        canManage: canManageApplications,
        onConfigureApplication,
        onDeleteApplication: onRequestDeleteApplication,
        onUpdateApplicationStatus: onRequestUpdateApplicationStatus,
      },
      colId: "actions",
      flex: 0.9,
      headerName: "操作",
      minWidth: 150,
      sortable: false,
    },
  ];
}
