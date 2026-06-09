import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import type { EChartsOption } from "echarts";
import * as echarts from "echarts";
import {
  AlertTriangle,
  type LucideIcon,
  Pause,
  RadioTower,
  RotateCcw,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { consoleGridTheme } from "@/components/common/ConsolePage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type {
  GrayHistoryRecord,
  GrayRollout,
  GraySnapshot,
  GrayStatus,
  GraySummaryItem,
} from "./types";

type GrayPageProps = {
  snapshot: GraySnapshot;
};

const graySteps = [1, 5, 10, 20, 50, 100];

const statusClass: Record<GrayStatus, string> = {
  已全量: "border-emerald-200 bg-emerald-50 text-emerald-700",
  推进中: "border-amber-200 bg-amber-50 text-amber-700",
};

const actionClass: Record<GrayHistoryRecord["action"], string> = {
  全量: "border-emerald-200 bg-emerald-50 text-emerald-700",
  回滚: "border-red-200 bg-red-50 text-red-600",
  推进: "border-blue-200 bg-blue-50 text-blue-700",
};

const summaryIconMap: Record<string, LucideIcon> = {
  active: RadioTower,
  alerts: AlertTriangle,
  health: ShieldCheck,
  users: UsersRound,
};

const summaryIconClass: Record<string, string> = {
  active: "bg-blue-50 text-blue-600",
  alerts: "bg-red-50 text-red-600",
  health: "bg-emerald-50 text-emerald-600",
  users: "bg-violet-50 text-violet-600",
};

export function GrayPage({ snapshot }: GrayPageProps) {
  const columnDefs = useMemo<ColDef<GrayHistoryRecord>[]>(
    () => [
      {
        field: "time",
        flex: 0.75,
        headerName: "时间",
        minWidth: 110,
      },
      {
        field: "releaseId",
        flex: 0.9,
        headerName: "发布单",
        minWidth: 130,
      },
      {
        cellRenderer: ActionCell,
        field: "action",
        flex: 0.7,
        headerName: "操作",
        minWidth: 92,
      },
      {
        cellRenderer: ChangeCell,
        colId: "change",
        flex: 0.9,
        headerName: "前 → 后",
        minWidth: 128,
      },
      {
        field: "operator",
        flex: 0.8,
        headerName: "操作人",
        minWidth: 112,
      },
      {
        field: "note",
        flex: 1.7,
        headerName: "说明",
        minWidth: 240,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<GrayHistoryRecord>>(
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
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">灰度管理</h1>
          <p className="mt-2 text-slate-600 text-sm">
            实时查看与调整灰度比例，监控错误率与覆盖用户
          </p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-4">
          {snapshot.summary.map((item) => (
            <SummaryCard key={item.id} item={item} />
          ))}
        </section>

        <section className="space-y-4">
          {snapshot.rollouts.map((rollout) => (
            <GrayRolloutCard key={rollout.id} rollout={rollout} />
          ))}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex h-12 items-center border-slate-200 border-b px-4">
            <h2 className="font-semibold text-slate-900 text-sm">灰度调整历史</h2>
          </div>
          <AgGridReact<GrayHistoryRecord>
            rowData={snapshot.histories}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={48}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />
        </section>
      </div>
    </>
  );
}

function SummaryCard({ item }: { item: GraySummaryItem }) {
  const Icon = summaryIconMap[item.id] ?? RadioTower;

  return (
    <Card className="rounded-lg px-5 py-4 shadow-none">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="font-medium text-slate-500 text-sm">{item.label}</div>
          <div className="font-semibold text-3xl text-slate-950 leading-none">{item.value}</div>
          <div className="font-medium text-slate-400 text-xs">{item.detail}</div>
        </div>
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            summaryIconClass[item.id] ?? "bg-slate-100 text-slate-500",
          )}
        >
          <Icon className="size-4" />
        </div>
      </div>
    </Card>
  );
}

function GrayRolloutCard({ rollout }: { rollout: GrayRollout }) {
  return (
    <Card className="overflow-hidden rounded-lg p-0 shadow-none">
      <div className="flex flex-col gap-2 border-slate-200 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="truncate font-semibold text-slate-950 text-sm">
          {rollout.releaseId} {rollout.title}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-slate-500 text-xs">
          <StatusBadge status={rollout.status} />
          <span>开始 {rollout.startAt}</span>
        </div>
      </div>

      <div className="grid gap-5 p-4 xl:grid-cols-12">
        <div className="min-w-0 space-y-3 xl:col-span-5">
          <div className="font-medium text-slate-500 text-xs">灰度比例</div>
          <div className="flex items-end gap-3">
            <div className="font-semibold text-5xl text-slate-950 leading-none">
              {rollout.percent}%
            </div>
            <div className="pb-1 font-medium text-slate-500 text-xs">≈ {rollout.audience}</div>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${rollout.percent}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {graySteps.map((step) => (
              <Button
                key={step}
                variant={step === rollout.percent ? "default" : "outline"}
                type="button"
                size="sm"
                className={cn(
                  "h-8 min-w-12 px-3 font-semibold text-xs",
                  step === rollout.percent
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100",
                )}
              >
                {step}%
              </Button>
            ))}
            {rollout.status === "推进中" ? (
              <>
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  className="h-8 border-slate-200 bg-white text-slate-700 text-xs"
                >
                  <Pause className="size-3.5" />
                  暂停
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  size="sm"
                  className="h-8 border-red-200 bg-white text-red-500 text-xs hover:bg-red-50 hover:text-red-600"
                >
                  <RotateCcw className="size-3.5" />
                  回滚
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="min-w-0 space-y-3 xl:col-span-3">
          <div className="font-medium text-slate-500 text-xs">健康度</div>
          <div className="font-semibold text-4xl text-emerald-600 leading-none">
            {rollout.health}
          </div>
          <div className="font-medium text-slate-500 text-xs">
            P99 加载 {rollout.p99} · JS 错误率 {rollout.jsErrorRate}
          </div>
          <div className="space-y-2 pt-2">
            {rollout.metrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between gap-4 text-xs">
                <span className="text-slate-500">{metric.label}</span>
                <span className="font-semibold text-slate-800">{metric.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 xl:col-span-4">
          <div className="mb-2 font-medium text-slate-500 text-xs">实时错误率（近 30 分钟）</div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
            <ErrorRateChart data={rollout.errorTrend} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function ErrorRateChart({ data }: { data: number[] }) {
  const chartRef = useRef<HTMLDivElement | null>(null);

  const option = useMemo<EChartsOption>(
    () => ({
      animationDuration: 450,
      color: ["#4b92e8"],
      grid: {
        bottom: 20,
        left: 4,
        right: 4,
        top: 8,
      },
      tooltip: {
        trigger: "axis",
      },
      xAxis: {
        axisLabel: {
          color: "#64748b",
          fontSize: 11,
          interval: 12,
        },
        axisLine: {
          lineStyle: {
            color: "#e5e7eb",
          },
        },
        axisTick: {
          show: false,
        },
        data: data.map((_, index) =>
          index === 0 ? "14:30" : index === 13 ? "14:45" : index === 26 ? "15:00" : "",
        ),
        type: "category",
      },
      yAxis: {
        axisLabel: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        splitLine: {
          show: false,
        },
        type: "value",
      },
      series: [
        {
          barMaxWidth: 7,
          data,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
          },
          type: "bar",
        },
      ],
    }),
    [data],
  );

  useEffect(() => {
    if (!chartRef.current) {
      return;
    }

    const chart = echarts.init(chartRef.current);
    chart.setOption(option);

    const resize = () => chart.resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      chart.dispose();
    };
  }, [option]);

  return <div ref={chartRef} className="h-28 w-full" />;
}

function StatusBadge({ status }: { status: GrayStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        statusClass[status],
      )}
    >
      {status}
    </span>
  );
}

function ActionCell({
  value,
}: ICellRendererParams<GrayHistoryRecord, GrayHistoryRecord["action"]>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        actionClass[value],
      )}
    >
      {value}
    </span>
  );
}

function ChangeCell({ data }: ICellRendererParams<GrayHistoryRecord>) {
  return data ? (
    <span className="font-mono font-semibold text-slate-700 text-xs">
      {data.before} → {data.after}
    </span>
  ) : null;
}
