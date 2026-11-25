import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { GitBranch, Rocket } from "lucide-react";
import { CommitInline } from "@/components/common/CommitInfo";
import { Button } from "@/components/ui/button";
import { buildTriggerLabels } from "../constants";
import type { BuildRunRecord, BuildRunStatus } from "../types";
import { BuildCreator, BuildPlatformBadges } from "./BuildMeta";
import { BuildStatusBadge } from "./BuildStatusBadge";

/** 详情面板打开时只保留这些列，其余信息在面板里看。 */
const compactColumns = new Set(["number", "module", "version", "status", "createdAt"]);

export function buildBuildsColumnDefs({
  canCreateRelease,
  compact = false,
  onPublish,
}: {
  canCreateRelease: boolean;
  compact?: boolean;
  onPublish: (build: BuildRunRecord) => void;
}): ColDef<BuildRunRecord>[] {
  const columns: ColDef<BuildRunRecord>[] = [
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
      flex: 1.7,
      headerName: "分支 / 提交",
      minWidth: 260,
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
      headerName: "操作",
      // 操作列固定在右侧，表格横向滚动时始终可见；固定列不参与 flex 分配，用固定宽度。
      lockPinned: true,
      pinned: "right",
      resizable: false,
      width: 104,
      sortable: false,
    },
  ];

  return compact
    ? columns
        .filter((column) => compactColumns.has(column.field ?? column.colId ?? ""))
        .map((column) => ({ ...column, minWidth: column.field === "createdAt" ? 150 : 76 }))
    : columns;
}

function BuildCell({ data }: ICellRendererParams<BuildRunRecord>) {
  if (!data) {
    return null;
  }

  return (
    <span className="truncate text-muted-foreground text-sm tabular-nums">{data.createdAt}</span>
  );
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
        <CommitInline commit={data.commit} />
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

  return <BuildStatusBadge status={value} />;
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
        className="h-7.5 gap-1.5"
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
