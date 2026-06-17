import { useQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Activity,
  Circle,
  Download,
  ListFilter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  TimerReset,
  UserRound,
} from "lucide-react";
import { useMemo } from "react";

import {
  ConsoleFilterSelect,
  ConsoleSearchInput,
  ConsoleTableFooter,
} from "@/components/common/ConsoleControls";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { MockCard as Card, MockSurface } from "@/components/common/MockSurface";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { miCarEnvironmentFilterOptions } from "@/types/environments";

import {
  fetchReleaseRecordsSnapshot,
  releaseRecordsSnapshotQueryKey,
} from "./api/release-records-snapshot";
import { releaseRecordStatusClass, releaseRecordTriggerLabels } from "./constants";
import type {
  ReleasePointerRecord,
  ReleaseRecordEnvironment,
  ReleaseRecordStatus,
  ReleaseRecordTriggerType,
} from "./types";

export function ReleaseRecordsPage() {
  const { data: snapshot } = useQuery({
    queryFn: fetchReleaseRecordsSnapshot,
    queryKey: releaseRecordsSnapshotQueryKey,
  });
  const stats = useMemo(
    () =>
      snapshot
        ? [
            { id: "total", label: "总发布", value: snapshot.summary.total, tone: "sky" },
            { id: "running", label: "指向中", value: snapshot.summary.running, tone: "blue" },
            { id: "success", label: "成功", value: snapshot.summary.success, tone: "emerald" },
            { id: "failed", label: "失败", value: snapshot.summary.failed, tone: "red" },
            { id: "queued", label: "排队中", value: snapshot.summary.queued, tone: "amber" },
          ]
        : [],
    [snapshot],
  );
  const columnDefs = useMemo<ColDef<ReleasePointerRecord>[]>(
    () => [
      {
        cellRenderer: CheckboxCell,
        headerComponent: CheckboxHeader,
        maxWidth: 44,
        minWidth: 44,
        pinned: "left",
        resizable: false,
        sortable: false,
        suppressHeaderMenuButton: true,
        suppressMovable: true,
      },
      {
        cellRenderer: ReleaseRecordCell,
        field: "id",
        flex: 1,
        headerName: "发布编号",
        minWidth: 172,
      },
      {
        field: "application",
        flex: 0.8,
        headerName: "应用",
        minWidth: 120,
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
        flex: 1.15,
        headerName: "指向产物",
        minWidth: 190,
      },
      {
        field: "moduleCount",
        flex: 0.56,
        headerName: "模块数",
        minWidth: 82,
      },
      {
        field: "strategy",
        flex: 0.78,
        headerName: "策略",
        minWidth: 112,
      },
      {
        cellRenderer: TriggerCell,
        field: "triggerType",
        flex: 0.78,
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
        headerName: "操作人",
        minWidth: 100,
      },
      {
        field: "effectiveAt",
        flex: 0.55,
        headerName: "生效时间",
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
        <p className="mt-2 text-slate-600 text-sm">
          记录手动、发布任务和流水线触发的访问接口产物指向变更
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

        <MockSurface
          as="section"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ConsoleFilterSelect
                icon={Rocket}
                label="环境"
                value="all"
                options={[
                  { label: "全部环境", value: "all" },
                  ...miCarEnvironmentFilterOptions.filter(({ value }) => value !== "dev"),
                ]}
              />
              <ConsoleFilterSelect
                icon={ListFilter}
                label="状态"
                value="all"
                options={[
                  { label: "全部状态", value: "all" },
                  { label: "running", value: "running" },
                  { label: "success", value: "success" },
                  { label: "failed", value: "failed" },
                ]}
              />
              <ConsoleFilterSelect
                icon={Activity}
                label="触发方式"
                value="all"
                options={[
                  { label: "全部触发", value: "all" },
                  { label: "手动指向", value: "manual" },
                  { label: "流水线指向", value: "pipeline" },
                  { label: "发布任务", value: "release_task" },
                ]}
              />
              <ConsoleFilterSelect
                icon={UserRound}
                label="操作人"
                value="all"
                options={[
                  { label: "全部操作人", value: "all" },
                  { label: "li.ming", value: "li.ming" },
                  { label: "release.bot", value: "release.bot" },
                ]}
              />
              <ConsoleFilterSelect
                icon={TimerReset}
                label="时间范围"
                value="all"
                options={[
                  { label: "全部时间", value: "all" },
                  { label: "今天", value: "today" },
                  { label: "近 7 天", value: "7d" },
                ]}
              />
              <ConsoleSearchInput />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon" aria-label="刷新发布记录">
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="outline" size="icon" aria-label="下载发布记录">
                <Download className="size-4" />
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="size-4" />
                手动指向
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
        </MockSurface>
      </div>
    </>
  );
}

function CheckboxHeader() {
  return <Checkbox aria-label="选择全部发布记录" />;
}

function CheckboxCell() {
  return (
    <div className="flex h-full items-center">
      <Checkbox aria-label="选择发布记录" />
    </div>
  );
}

function ReleaseRecordCell({ data }: ICellRendererParams<ReleasePointerRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate font-semibold text-blue-600 text-sm">{data.id}</div>
      <div className="mt-1 truncate text-slate-600 text-xs">{data.triggerId}</div>
    </div>
  );
}

function EnvironmentCell({
  value,
}: ICellRendererParams<ReleasePointerRecord, ReleaseRecordEnvironment>) {
  return value ? <EnvironmentBadge environment={value} /> : null;
}

function TriggerCell({
  value,
}: ICellRendererParams<ReleasePointerRecord, ReleaseRecordTriggerType>) {
  return value ? (
    <span className="font-medium text-slate-700 text-xs">{releaseRecordTriggerLabels[value]}</span>
  ) : null;
}

function StatusCell({ value }: ICellRendererParams<ReleasePointerRecord, ReleaseRecordStatus>) {
  if (!value) {
    return null;
  }

  const Icon = value === "running" ? Rocket : value === "success" ? ShieldCheck : Activity;

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

function ActionsCell() {
  return (
    <div className="flex h-full items-center gap-2 whitespace-nowrap font-medium text-blue-600 text-xs">
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
      >
        详情
      </Button>
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-blue-600 text-xs hover:text-blue-700"
      >
        回滚
      </Button>
      <Button variant="ghost" type="button" size="icon" className="size-6 text-slate-500">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
