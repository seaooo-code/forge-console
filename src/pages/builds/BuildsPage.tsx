import { useQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Activity,
  Circle,
  Clock3,
  GitBranch,
  MoreHorizontal,
  PackageCheck,
  RefreshCw,
} from "lucide-react";
import { useMemo } from "react";

import { ConsoleTableFooter } from "@/components/common/ConsoleControls";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { buildsSnapshotQueryKey, fetchBuildsSnapshot } from "./api/builds-snapshot";
import { buildStatusClass, buildTriggerLabels } from "./constants";
import type { BuildRunRecord, BuildRunStatus, BuildTriggerType } from "./types";

export function BuildsPage() {
  const {
    data: snapshot,
    isFetching,
    refetch,
  } = useQuery({
    queryFn: fetchBuildsSnapshot,
    queryKey: buildsSnapshotQueryKey,
  });
  const stats = useMemo(
    () =>
      snapshot
        ? [
            { id: "total", label: "总构建", value: snapshot.summary.total, tone: "sky" },
            { id: "running", label: "构建中", value: snapshot.summary.running, tone: "blue" },
            { id: "success", label: "成功", value: snapshot.summary.success, tone: "emerald" },
            { id: "failed", label: "失败", value: snapshot.summary.failed, tone: "red" },
            { id: "queued", label: "排队中", value: snapshot.summary.queued, tone: "amber" },
          ]
        : [],
    [snapshot],
  );
  const columnDefs = useMemo<ColDef<BuildRunRecord>[]>(
    () => [
      {
        cellRenderer: BuildCell,
        field: "id",
        flex: 1,
        headerName: "构建编号",
        minWidth: 168,
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
        cellRenderer: ActionsCell,
        colId: "actions",
        flex: 0.74,
        headerName: "操作",
        minWidth: 112,
        sortable: false,
      },
    ],
    [],
  );
  const defaultColDef = useMemo<ColDef<BuildRunRecord>>(
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
    return null;
  }

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">构建记录</h1>
        <p className="mt-2 text-slate-600 text-sm">
          汇总所有模块构建执行，区分手动触发、任务触发与流水线触发
        </p>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {stats.map((item) => (
            <Card key={item.id} className="rounded-lg px-5 py-4 shadow-none">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-medium text-slate-500 text-sm">{item.label}</div>
                  <div className="mt-2 font-semibold text-3xl text-slate-950 leading-none">
                    {item.value}
                  </div>
                </div>
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border",
                    item.tone === "emerald" && "border-emerald-200 bg-emerald-50 text-emerald-600",
                    item.tone === "red" && "border-red-200 bg-red-50 text-red-600",
                    item.tone === "amber" && "border-amber-200 bg-amber-50 text-amber-600",
                    item.tone === "blue" && "border-blue-200 bg-blue-50 text-blue-600",
                    item.tone === "sky" && "border-sky-200 bg-sky-50 text-sky-600",
                  )}
                >
                  <Circle className="size-2 fill-current" />
                </div>
              </div>
            </Card>
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="font-medium text-slate-500 text-sm">最近构建</span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="刷新构建记录"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>

          <AgGridReact<BuildRunRecord>
            rowData={snapshot.builds}
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

          <ConsoleTableFooter total={snapshot.builds.length} />
        </section>
      </div>
    </>
  );
}

function BuildCell({ data }: ICellRendererParams<BuildRunRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate font-semibold text-blue-600 text-sm">{data.id}</div>
      <div className="mt-1 truncate text-slate-600 text-xs">{data.artifact}</div>
    </div>
  );
}

function BranchCell({ data }: ICellRendererParams<BuildRunRecord>) {
  if (!data) {
    return null;
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <GitBranch className="size-3.5 shrink-0 text-slate-400" />
      <span className="truncate font-mono text-slate-700 text-xs">
        {data.branch} · {data.commit}
      </span>
    </span>
  );
}

function TriggerCell({ value }: ICellRendererParams<BuildRunRecord, BuildTriggerType>) {
  return value ? (
    <span className="font-medium text-slate-700 text-xs">{buildTriggerLabels[value]}</span>
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

function ActionsCell() {
  return (
    <div className="flex h-full items-center gap-2 whitespace-nowrap font-medium text-blue-600 text-xs">
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
      >
        日志
      </Button>
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
      >
        产物
      </Button>
      <Button variant="ghost" type="button" size="icon" className="size-6 text-slate-500">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
