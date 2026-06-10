import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Activity,
  Box,
  CheckCircle2,
  Circle,
  CircleCheck,
  CircleDot,
  Clock3,
  Code2,
  Download,
  GitBranch,
  ListFilter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  TimerReset,
  UserRound,
  XCircle,
} from "lucide-react";
import { useMemo } from "react";

import {
  ConsoleFilterSelect,
  ConsoleSearchInput,
  ConsoleTableFooter,
} from "@/components/common/ConsoleControls";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

import type {
  PipelineRecord,
  PipelineStatus,
  PipelineStepStatus,
  PipelinesSnapshot,
} from "./types";

type PipelinesPageProps = {
  snapshot: PipelinesSnapshot;
};

const runStatusClass: Record<PipelineStatus, string> = {
  canceled: "border-slate-200 bg-slate-50 text-slate-600",
  failed: "border-red-200 bg-red-50 text-red-600",
  queued: "border-amber-200 bg-amber-50 text-amber-700",
  running: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const stepClass: Record<PipelineStepStatus, string> = {
  done: "border-emerald-600 bg-emerald-600 text-white",
  pending: "border-slate-200 bg-slate-100 text-slate-400",
  running: "border-blue-600 bg-blue-600 text-white",
};

export function PipelinesPage({ snapshot }: PipelinesPageProps) {
  const stats = useMemo(
    () => [
      {
        iconClass: "border-sky-200 bg-sky-50 text-sky-600",
        id: "total",
        label: "今日总数",
        value: "1,284",
      },
      {
        iconClass: "border-emerald-200 bg-emerald-50 text-emerald-600",
        id: "success",
        label: "成功",
        value: "1,196",
      },
      {
        iconClass: "border-red-200 bg-red-50 text-red-600",
        id: "failed",
        label: "失败",
        value: "62",
      },
      {
        iconClass: "border-cyan-200 bg-cyan-50 text-cyan-600",
        id: "running",
        label: "运行中",
        value: "9",
      },
      {
        iconClass: "border-amber-200 bg-amber-50 text-amber-600",
        id: "queued",
        label: "排队中",
        value: "12",
      },
      {
        iconClass: "border-slate-200 bg-slate-50 text-slate-500",
        id: "avg",
        label: "平均耗时",
        value: "2m 38s",
      },
    ],
    [],
  );

  const columnDefs = useMemo<ColDef<PipelineRecord>[]>(
    () => [
      {
        cellRenderer: CheckboxCell,
        headerComponent: CheckboxHeader,
        maxWidth: 48,
        minWidth: 48,
        pinned: "left",
        resizable: false,
        sortable: false,
        suppressHeaderMenuButton: true,
        suppressMovable: true,
      },
      {
        cellRenderer: RunIdCell,
        field: "id",
        flex: 0.8,
        headerName: "RUN ID",
        minWidth: 120,
      },
      {
        field: "task",
        flex: 0.7,
        headerName: "任务",
        minWidth: 100,
      },
      {
        field: "module",
        flex: 0.8,
        headerName: "模块",
        minWidth: 110,
      },
      {
        cellRenderer: BranchCell,
        field: "branch",
        flex: 1.4,
        headerName: "分支",
        minWidth: 240,
      },
      {
        cellRenderer: CommitCell,
        field: "commit",
        flex: 0.75,
        headerName: "COMMIT",
        minWidth: 105,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.7,
        headerName: "状态",
        minWidth: 100,
      },
      {
        field: "duration",
        flex: 0.55,
        headerName: "时长",
        minWidth: 88,
      },
      {
        field: "executor",
        flex: 0.75,
        headerName: "执行人",
        minWidth: 110,
      },
      {
        field: "startedAt",
        flex: 0.75,
        headerName: "开始",
        minWidth: 110,
      },
      {
        cellRenderer: ActionsCell,
        colId: "actions",
        flex: 0.65,
        headerName: "操作",
        minWidth: 110,
        sortable: false,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<PipelineRecord>>(
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

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">流水线执行记录</h1>
          <p className="mt-2 text-slate-600 text-sm">构建、打包、Bundle 上传的所有 Pipeline Run</p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-6">
          {stats.map((item) => (
            <Card key={item.id} className="rounded-lg px-5 py-4 shadow-none">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="font-medium text-slate-500 text-sm">{item.label}</div>
                  <div className="font-semibold text-3xl text-slate-950 leading-none">
                    {item.value}
                  </div>
                </div>
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded border",
                    item.iconClass,
                  )}
                >
                  <Circle className="size-2 fill-current" />
                </div>
              </div>
            </Card>
          ))}
        </section>

        <Card className="rounded-lg p-0 shadow-none">
          <div className="flex items-center justify-between border-slate-200 border-b px-4 py-3">
            <div className="font-semibold text-slate-900 text-sm">
              {snapshot.currentRun.id} · {snapshot.currentRun.module} · {snapshot.currentRun.branch}
            </div>
            <div className="font-medium text-slate-500 text-xs">
              {snapshot.currentRun.statusText} · {snapshot.currentRun.duration}
            </div>
          </div>
          <div className="flex items-start px-6 py-5">
            {snapshot.currentRun.steps.map((step, index) => (
              <div key={step.id} className="flex flex-1 items-start">
                <div className="flex min-w-16 flex-col items-center text-center">
                  <div
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border-2",
                      stepClass[step.status],
                    )}
                  >
                    {step.status === "running" ? (
                      <Activity className="size-4" />
                    ) : step.status === "done" ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Clock3 className="size-4" />
                    )}
                  </div>
                  <div className="mt-2 max-w-20 font-semibold text-slate-700 text-xs leading-4">
                    {step.label}
                  </div>
                  <div className="mt-1 text-slate-500 text-xs">
                    {step.status === "done" ? "✓ " : ""}
                    {step.duration}
                  </div>
                </div>
                {index < snapshot.currentRun.steps.length - 1 ? (
                  <div
                    className={cn(
                      "mt-4 h-px flex-1",
                      step.status === "pending" ? "bg-slate-200" : "bg-emerald-500",
                    )}
                  />
                ) : null}
              </div>
            ))}
          </div>
        </Card>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
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
                icon={Box}
                label="模块"
                value="all"
                options={[
                  { label: "全部模块", value: "all" },
                  { label: "home", value: "home" },
                  { label: "vehicle", value: "vehicle" },
                  { label: "ai-assistant", value: "ai" },
                ]}
              />
              <ConsoleFilterSelect
                icon={Code2}
                label="任务"
                value="all"
                options={[
                  { label: "全部任务", value: "all" },
                  { label: "MCAR-1234", value: "mcar-1234" },
                  { label: "MCAR-1228", value: "mcar-1228" },
                ]}
              />
              <ConsoleFilterSelect
                icon={UserRound}
                label="执行人"
                value="all"
                options={[
                  { label: "全部执行人", value: "all" },
                  { label: "li.ming", value: "li.ming" },
                  { label: "wang.fang", value: "wang.fang" },
                  { label: "zhao.lei", value: "zhao.lei" },
                ]}
              />
              <ConsoleFilterSelect
                icon={TimerReset}
                label="时间范围"
                value="all"
                options={[
                  { label: "全部时间", value: "all" },
                  { label: "近 1 小时", value: "1h" },
                  { label: "今天", value: "today" },
                ]}
              />
              <ConsoleSearchInput />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon" aria-label="刷新流水线">
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="outline" size="icon" aria-label="下载流水线">
                <Download className="size-4" />
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="size-4" />
                触发流水线
              </Button>
            </div>
          </div>

          <AgGridReact<PipelineRecord>
            rowData={snapshot.pipelines}
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

          <ConsoleTableFooter total={snapshot.pipelines.length} />
        </section>
      </div>
    </>
  );
}

function CheckboxHeader() {
  return <Checkbox aria-label="选择全部流水线" />;
}

function CheckboxCell() {
  return (
    <div className="flex h-full items-center">
      <Checkbox aria-label="选择流水线" />
    </div>
  );
}

function RunIdCell({ data }: ICellRendererParams<PipelineRecord>) {
  if (!data) {
    return null;
  }

  const StatusIcon =
    data.status === "running"
      ? Activity
      : data.status === "success"
        ? CircleCheck
        : data.status === "failed"
          ? XCircle
          : data.status === "queued"
            ? Clock3
            : CircleDot;

  return (
    <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600 text-sm">
      <StatusIcon className="size-3.5" />
      {data.id}
    </span>
  );
}

function BranchCell({ value }: ICellRendererParams<PipelineRecord, string>) {
  return value ? (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <GitBranch className="size-3.5 shrink-0 text-slate-400" />
      <span className="truncate font-mono text-slate-700 text-xs">{value}</span>
    </span>
  ) : null;
}

function CommitCell({ value }: ICellRendererParams<PipelineRecord, string>) {
  return value ? <span className="font-mono text-slate-700 text-xs">→ {value}</span> : null;
}

function StatusCell({ value }: ICellRendererParams<PipelineRecord, PipelineStatus>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        runStatusClass[value],
      )}
    >
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
        重跑
      </Button>
      <Button variant="ghost" type="button" size="icon" className="size-6 text-slate-500">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
