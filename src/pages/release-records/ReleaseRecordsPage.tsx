import { useQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Circle, RefreshCw, Rocket, ShieldCheck } from "lucide-react";
import { useMemo } from "react";

import { ConsoleTableFooter } from "@/components/common/ConsoleControls";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  fetchReleaseRecordsSnapshot,
  releaseRecordsSnapshotQueryKey,
} from "./api/release-records-snapshot";
import { releaseRecordStatusClass, releaseRecordTypeLabels } from "./constants";
import type { ReleasePointerRecord, ReleaseRecordStatus, ReleaseRecordType } from "./types";

export function ReleaseRecordsPage() {
  const {
    data: snapshot,
    isFetching,
    refetch,
  } = useQuery({
    queryFn: fetchReleaseRecordsSnapshot,
    queryKey: releaseRecordsSnapshotQueryKey,
  });
  const stats = useMemo(
    () =>
      snapshot
        ? [
            { id: "total", label: "总发布", value: snapshot.summary.total, tone: "sky" },
            { id: "active", label: "生效中", value: snapshot.summary.active, tone: "emerald" },
            { id: "inactive", label: "已失效", value: snapshot.summary.inactive, tone: "slate" },
            { id: "revoked", label: "已撤销", value: snapshot.summary.revoked, tone: "red" },
          ]
        : [],
    [snapshot],
  );
  const columnDefs = useMemo<ColDef<ReleasePointerRecord>[]>(
    () => [
      {
        cellRenderer: ReleaseRecordCell,
        field: "id",
        flex: 1,
        headerName: "发布编号",
        minWidth: 172,
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
        field: "artifact",
        flex: 1.25,
        headerName: "指向产物",
        minWidth: 220,
      },
      {
        cellRenderer: ReleaseTypeCell,
        field: "releaseType",
        flex: 0.65,
        headerName: "发布类型",
        minWidth: 102,
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
      {
        field: "createdAt",
        flex: 0.68,
        headerName: "发布时间",
        minWidth: 110,
      },
      {
        field: "updatedAt",
        flex: 0.68,
        headerName: "更新时间",
        minWidth: 110,
      },
    ],
    [],
  );
  const defaultColDef = useMemo<ColDef<ReleasePointerRecord>>(
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
        <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">发布记录</h1>
        <p className="mt-2 text-slate-600 text-sm">记录构建产物发布后的访问路由指向变更</p>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
                    item.tone === "sky" && "border-sky-200 bg-sky-50 text-sky-600",
                    item.tone === "slate" && "border-slate-200 bg-slate-50 text-slate-500",
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
              <span className="font-medium text-slate-500 text-sm">最近发布</span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                aria-label="刷新发布记录"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>

          <AgGridReact<ReleasePointerRecord>
            rowData={snapshot.records}
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

          <ConsoleTableFooter total={snapshot.records.length} />
        </section>
      </div>
    </>
  );
}

function ReleaseRecordCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate font-semibold text-blue-600 text-sm">{data.id}</div>
      <div className="mt-1 truncate text-slate-600 text-xs">{data.buildRecordId}</div>
    </div>
  );
}

function ModuleCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate font-semibold text-slate-800 text-sm">{data.module}</div>
      <div className="mt-1 truncate text-slate-500 text-xs">{data.moduleId}</div>
    </div>
  );
}

function EnvironmentCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  return data ? (
    <EnvironmentBadge environment={data.environment}>{data.environmentName}</EnvironmentBadge>
  ) : null;
}

function ReleaseTypeCell({ value }: ICellRendererParams<ReleasePointerRecord, ReleaseRecordType>) {
  return value ? (
    <span className="font-medium text-slate-700 text-xs">{releaseRecordTypeLabels[value]}</span>
  ) : null;
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
      {value}
    </span>
  );
}
