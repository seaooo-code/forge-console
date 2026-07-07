import { useQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Circle, RefreshCw, Rocket, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { DataTable, FilterBar, KpiCard, PageHeader, TablePagination } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  fetchReleaseRecordsSnapshot,
  releaseRecordsSnapshotQueryKey,
} from "./api/release-records-snapshot";
import {
  getReleaseRecordTypeLabel,
  releaseRecordStatusClass,
  releaseRecordStatusLabels,
} from "./constants";
import type { ReleasePointerRecord, ReleaseRecordStatus } from "./types";

const PAGE_SIZE = 20;

type ReleaseRecordsPageProps = {
  onOpenRelease: (releaseId: string) => void;
};

export function ReleaseRecordsPage({ onOpenRelease }: ReleaseRecordsPageProps) {
  const {
    data: snapshot,
    isFetching,
    refetch,
  } = useQuery({
    queryFn: () => fetchReleaseRecordsSnapshot(),
    queryKey: releaseRecordsSnapshotQueryKey,
  });
  const [page, setPage] = useState(1);
  const stats = useMemo(
    () =>
      snapshot
        ? [
            {
              detail: "全部发布记录",
              icon: Rocket,
              id: "total",
              label: "总发布",
              tone: "info" as const,
              value: snapshot.summary.total,
            },
            {
              detail: "当前可访问",
              icon: ShieldCheck,
              id: "active",
              label: "生效中",
              tone: "success" as const,
              value: snapshot.summary.active,
            },
            {
              detail: "已被替换",
              icon: Circle,
              id: "inactive",
              label: "已失效",
              tone: "muted" as const,
              value: snapshot.summary.inactive,
            },
          ]
        : [],
    [snapshot],
  );
  const columnDefs = useMemo<ColDef<ReleasePointerRecord>[]>(
    () => [
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
        cellRenderer: EnvironmentCell,
        field: "environment",
        flex: 0.58,
        headerName: "环境",
        minWidth: 90,
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
        cellRenderer: ExpiresAtCell,
        field: "expiresAt",
        flex: 0.8,
        headerName: "过期时间",
        minWidth: 132,
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
    ],
    [],
  );

  if (!snapshot) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="发布记录" description="记录构建产物发布后的访问路由指向变更" />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((item) => (
          <KpiCard
            key={item.id}
            icon={item.icon}
            label={item.label}
            value={item.value}
            detail={item.detail}
            tone={item.tone}
          />
        ))}
      </section>

      <FilterBar
        label="最近发布"
        actions={
          <Button
            variant="outline"
            size="icon"
            aria-label="刷新发布记录"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            <RefreshCw className="size-4" />
          </Button>
        }
      />

      <DataTable
        rows={snapshot.records}
        columnDefs={columnDefs}
        getRowId={({ data }) => data.id}
        onRowClicked={({ data }) => {
          if (data) {
            onOpenRelease(data.id);
          }
        }}
      />

      <Card className="rounded-xl border-border bg-card py-0 shadow-xs">
        <TablePagination
          page={page}
          pageSize={PAGE_SIZE}
          total={snapshot.records.length}
          onPageChange={setPage}
          onPageSizeChange={() => {
            // hook left here for future wiring; current snapshot returns the full list
          }}
        />
      </Card>
    </div>
  );
}

function ReleaseRecordCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  if (!data) {
    return null;
  }

  return <span className="truncate font-semibold text-primary text-sm">{data.createdAtShort}</span>;
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

function EnvironmentCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  return data ? (
    <EnvironmentBadge environment={data.environment}>{data.environmentName}</EnvironmentBadge>
  ) : null;
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

  if (data.grayStrategy === "targeted") {
    return (
      <span className="truncate font-mono font-semibold text-foreground text-xs">
        {data.identifier || "-"}
      </span>
    );
  }

  if (data.grayStrategy === "percentage") {
    const percentage = Math.max(0, Math.min(100, data.grayPercentage));

    return (
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-foreground text-xs">{percentage}%</div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
        </div>
      </div>
    );
  }

  return <span className="text-muted-foreground text-xs">-</span>;
}

function ExpiresAtCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  if (!data) {
    return null;
  }

  return <span className="truncate text-muted-foreground text-xs">{data.expiresAtShort}</span>;
}

function StatusCell({ value }: ICellRendererParams<ReleasePointerRecord, ReleaseRecordStatus>) {
  if (!value) {
    return null;
  }

  const Icon = value === "active" ? ShieldCheck : Rocket;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded border px-2 font-semibold text-xs leading-none",
        releaseRecordStatusClass[value],
      )}
    >
      <Icon className="size-3" />
      {releaseRecordStatusLabels[value]}
    </span>
  );
}
