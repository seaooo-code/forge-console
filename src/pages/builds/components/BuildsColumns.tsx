import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Activity, Clock3, GitBranch, PackageCheck, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { buildStatusClass, buildTriggerLabels } from "../constants";
import type { BuildRunRecord, BuildRunStatus, BuildTriggerType } from "../types";

export function buildBuildsColumnDefs({
  canCreateRelease,
  onPublish,
}: {
  canCreateRelease: boolean;
  onPublish: (build: BuildRunRecord) => void;
}): ColDef<BuildRunRecord>[] {
  return [
    {
      cellRenderer: BuildIDCell,
      field: "id",
      flex: 0.45,
      headerName: "ID",
      minWidth: 96,
    },
    {
      cellRenderer: BuildCell,
      field: "createdAt",
      flex: 1,
      headerName: "构建时间",
      minWidth: 176,
    },
    {
      field: "application",
      flex: 0.8,
      headerName: "应用",
      minWidth: 120,
    },
    {
      field: "module",
      flex: 0.75,
      headerName: "模块",
      minWidth: 110,
    },
    {
      cellRenderer: BranchCell,
      field: "branch",
      flex: 1.3,
      headerName: "分支",
      minWidth: 220,
    },
    {
      field: "version",
      flex: 0.85,
      headerName: "环境",
      minWidth: 130,
    },
    {
      cellRenderer: TriggerCell,
      field: "triggerType",
      flex: 0.75,
      headerName: "触发方式",
      minWidth: 110,
    },
    {
      cellRenderer: StatusCell,
      field: "status",
      flex: 0.65,
      headerName: "状态",
      minWidth: 92,
    },
    {
      field: "operator",
      flex: 0.7,
      headerName: "触发人",
      minWidth: 100,
    },
    {
      field: "duration",
      flex: 0.55,
      headerName: "耗时",
      minWidth: 82,
    },
    {
      cellRenderer: (params: ICellRendererParams<BuildRunRecord>) => (
        <ActionsCell canCreateRelease={canCreateRelease} data={params.data} onPublish={onPublish} />
      ),
      colId: "actions",
      flex: 0.65,
      headerName: "操作",
      minWidth: 92,
      sortable: false,
    },
  ];
}

function BuildCell({ data }: ICellRendererParams<BuildRunRecord>) {
  if (!data) {
    return null;
  }

  return <span className="truncate font-semibold text-primary text-sm">{data.createdAt}</span>;
}

function BuildIDCell({ value }: ICellRendererParams<BuildRunRecord, string>) {
  return value ? (
    <span className="truncate font-mono font-semibold text-foreground text-xs">
      #{value.trim().slice(-8)}
    </span>
  ) : null;
}

function BranchCell({ data }: ICellRendererParams<BuildRunRecord>) {
  if (!data) {
    return null;
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate font-mono text-foreground text-xs">
        {data.branch} · {data.commit}
      </span>
    </span>
  );
}

function TriggerCell({ value }: ICellRendererParams<BuildRunRecord, BuildTriggerType>) {
  return value ? (
    <span className="font-medium text-foreground text-xs">{buildTriggerLabels[value]}</span>
  ) : null;
}

function StatusCell({ value }: ICellRendererParams<BuildRunRecord, BuildRunStatus>) {
  if (!value) {
    return null;
  }

  const Icon = value === "running" ? Activity : value === "queued" ? Clock3 : PackageCheck;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded border px-2 font-semibold text-xs leading-none",
        buildStatusClass[value],
      )}
    >
      <Icon className="size-3" />
      {value}
    </span>
  );
}

function ActionsCell({
  canCreateRelease,
  data,
  onPublish,
}: {
  canCreateRelease: boolean;
  data?: BuildRunRecord;
  onPublish: (build: BuildRunRecord) => void;
}) {
  if (!data) {
    return null;
  }

  const canPublish = canCreateRelease && data.status === "success";

  return (
    <div className="flex h-full items-center" data-build-row-action="true">
      <Button
        variant="outline"
        type="button"
        size="sm"
        className="h-8 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary"
        disabled={!canPublish}
        onClick={(event) => {
          event.stopPropagation();
          onPublish(data);
        }}
      >
        <Rocket className="size-3.5" />
        发布
      </Button>
    </div>
  );
}
