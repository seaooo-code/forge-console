import type { ColDef, ICellRendererParams } from "ag-grid-community";

import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { getReleaseRecordTypeLabel } from "../constants";
import type { EnvironmentTone, ReleasePointerRecord, ReleaseRecordStatus } from "../types";
import { ReleaseStatusBadge } from "./ReleaseBadges";

/** 详情面板打开时只保留这些列。 */
const compactColumns = new Set(["id", "module", "environment", "releaseType", "status"]);

export function buildReleaseRecordsColumnDefs(
  environmentTones: ReadonlyMap<string, EnvironmentTone>,
  compact = false,
): ColDef<ReleasePointerRecord>[] {
  const columns: ColDef<ReleasePointerRecord>[] = [
    {
      cellRenderer: ReleaseIDCell,
      field: "id",
      flex: 0.45,
      headerName: "ID",
      minWidth: 96,
    },
    {
      cellRenderer: ReleaseRecordCell,
      field: "createdAt",
      flex: 1,
      headerName: "发布时间",
      minWidth: 176,
    },
    {
      field: "application",
      flex: 0.75,
      headerName: "应用",
      minWidth: 120,
    },
    {
      cellRenderer: ModuleCell,
      field: "module",
      flex: 0.75,
      headerName: "模块",
      minWidth: 130,
    },
    {
      cellRenderer: ({ data }: ICellRendererParams<ReleasePointerRecord>) =>
        data ? (
          <EnvironmentBadge
            environment={data.environment}
            tone={environmentTones.get(data.environment)}
          >
            {data.environmentName}
          </EnvironmentBadge>
        ) : null,
      field: "environment",
      flex: 0.58,
      headerName: "环境",
      minWidth: 90,
    },
    {
      cellRenderer: ChannelCell,
      field: "channel",
      flex: 0.55,
      headerName: "渠道",
      minWidth: 84,
    },
    {
      cellRenderer: RuntimeVersionCell,
      field: "runtimeVersion",
      flex: 0.7,
      headerName: "运行时版本",
      minWidth: 110,
    },
    {
      cellRenderer: ReleaseTypeCell,
      field: "releaseType",
      flex: 0.65,
      headerName: "发布类型",
      minWidth: 102,
    },
    {
      cellRenderer: GrayConfigCell,
      field: "grayStrategy",
      flex: 0.82,
      headerName: "灰度配置",
      minWidth: 136,
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
      headerName: "操作人",
      minWidth: 100,
    },
  ];

  return compact
    ? columns
        .filter((column) => compactColumns.has(column.field ?? ""))
        .map((column) => ({ ...column, minWidth: 80 }))
    : columns;
}

function ReleaseRecordCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  if (!data) {
    return null;
  }

  return (
    <span className="truncate text-muted-foreground text-sm tabular-nums">
      {data.createdAtShort}
    </span>
  );
}

function ReleaseIDCell({ value }: ICellRendererParams<ReleasePointerRecord, string>) {
  return value ? (
    <span className="truncate font-mono font-semibold text-foreground text-xs">
      #{value.trim().slice(-8)}
    </span>
  ) : null;
}

function ModuleCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate font-semibold text-foreground text-sm">{data.module}</div>
    </div>
  );
}

function ChannelCell({ value }: ICellRendererParams<ReleasePointerRecord, string>) {
  return value ? (
    <span className="truncate font-mono font-semibold text-foreground text-xs">{value}</span>
  ) : (
    <span className="text-muted-foreground text-xs">默认</span>
  );
}

function RuntimeVersionCell({ value }: ICellRendererParams<ReleasePointerRecord, string>) {
  return value ? (
    <span className="truncate font-mono font-semibold text-foreground text-xs">{value}</span>
  ) : (
    <span className="text-muted-foreground text-xs">-</span>
  );
}

function ReleaseTypeCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  return data ? (
    <span className="font-medium text-foreground text-xs">{getReleaseRecordTypeLabel(data)}</span>
  ) : null;
}

function GrayConfigCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  if (!data) {
    return null;
  }

  if (data.releaseType !== "gray") {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  if (data.grayStrategy === "percentage") {
    const percentage = Math.max(0, Math.min(100, data.grayPercentage));

    return (
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-foreground text-xs">{percentage}%</div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-route-percentage"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return <span className="text-muted-foreground text-xs">-</span>;
}

function StatusCell({ value }: ICellRendererParams<ReleasePointerRecord, ReleaseRecordStatus>) {
  if (!value) {
    return null;
  }

  return <ReleaseStatusBadge status={value} />;
}
