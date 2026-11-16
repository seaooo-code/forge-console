import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Activity, Clock3, GitBranch, PackageCheck, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { buildStatusClass, buildTriggerLabels } from "../constants";
import type { BuildRunRecord, BuildRunStatus } from "../types";
import { BuildCommitLink, BuildCreator, BuildPlatformBadges } from "./BuildMeta";

export function buildBuildsColumnDefs({
  canCreateRelease,
  onPublish,
}: {
  canCreateRelease: boolean;
  onPublish: (build: BuildRunRecord) => void;
}): ColDef<BuildRunRecord>[] {
  return [
    {
      cellRenderer: BuildNumberCell,
      field: "number",
      flex: 0.45,
      headerName: "构建号",
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
      flex: 1.2,
      headerName: "分支 / Commit",
      minWidth: 200,
    },
    {
      cellRenderer: RuntimeVersionCell,
      field: "runtimeVersion",
      flex: 0.75,
      headerName: "运行时版本",
      minWidth: 110,
    },
    {
      cellRenderer: PlatformsCell,
      field: "platforms",
      flex: 0.9,
      headerName: "平台",
      minWidth: 140,
      sortable: false,
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
      flex: 0.8,
      headerName: "触发方式",
      minWidth: 120,
    },
    {
      cellRenderer: StatusCell,
      field: "status",
      flex: 0.65,
      headerName: "状态",
      minWidth: 92,
    },
    {
      cellRenderer: ({ data }: ICellRendererParams<BuildRunRecord>) =>
        data ? <BuildCreator createdBy={data.createdBy} /> : null,
      colId: "createdBy",
      flex: 0.8,
      headerName: "创建人",
      minWidth: 120,
      sortable: false,
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

function BuildNumberCell({ data }: ICellRendererParams<BuildRunRecord>) {
  if (!data) {
    return null;
  }

  return (
    <span className="truncate font-mono font-semibold text-foreground text-xs" title={data.id}>
      {data.number ? `#${data.number}` : `#${data.id.trim().slice(-8)}`}
    </span>
  );
}

function BranchCell({ data }: ICellRendererParams<BuildRunRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="min-w-0 leading-tight">
      <div className="flex min-w-0 items-center gap-1.5">
        <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-mono text-foreground text-xs">{data.branch}</span>
      </div>
      <div className="mt-1 flex min-w-0 items-center gap-1.5 pl-5">
        <BuildCommitLink build={data} />
      </div>
    </div>
  );
}

function RuntimeVersionCell({ value }: ICellRendererParams<BuildRunRecord, string>) {
  return value ? (
    <span className="truncate font-mono font-semibold text-foreground text-xs">{value}</span>
  ) : (
    <span className="text-muted-foreground text-xs">-</span>
  );
}

function PlatformsCell({ value }: ICellRendererParams<BuildRunRecord, string[]>) {
  return <BuildPlatformBadges platforms={value ?? []} />;
}

function TriggerCell({ data }: ICellRendererParams<BuildRunRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate font-medium text-foreground text-xs">
        {buildTriggerLabels[data.triggerType]}
      </div>
      {data.triggerType === "webhook" && data.triggerId !== "-" ? (
        <div
          className="mt-1 truncate font-mono text-muted-foreground text-xs"
          title={data.triggerId}
        >
          {data.triggerId}
        </div>
      ) : null}
    </div>
  );
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
