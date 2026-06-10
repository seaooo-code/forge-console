import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  History,
  type LucideIcon,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { useMemo } from "react";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { miCarEnvironmentShortLabels } from "@/types/environments";

import type {
  RollbackCombinationStatus,
  RollbackEnvironment,
  RollbackEnvironmentState,
  RollbackHistoryCombination,
  RollbackRecord,
  RollbackRisk,
  RollbackSnapshot,
} from "./types";

type RollbackPageProps = {
  snapshot: RollbackSnapshot;
};

const riskClass: Record<RollbackRisk, string> = {
  low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  med: "border-amber-200 bg-amber-50 text-amber-700",
};

const statusClass: Record<RollbackCombinationStatus, string> = {
  可回滚: "border-blue-200 bg-blue-50 text-blue-700",
  已回滚: "border-red-200 bg-red-50 text-red-600",
  运行中: "border-sky-200 bg-sky-50 text-sky-700",
};

export function RollbackPage({ snapshot }: RollbackPageProps) {
  const columnDefs = useMemo<ColDef<RollbackRecord>[]>(
    () => [
      {
        field: "time",
        flex: 0.9,
        headerName: "时间",
        minWidth: 142,
      },
      {
        cellRenderer: EnvironmentCell,
        field: "environment",
        flex: 0.55,
        headerName: "环境",
        minWidth: 80,
      },
      {
        cellRenderer: CombinationCell,
        field: "fromCombination",
        flex: 1.25,
        headerName: "由",
        minWidth: 210,
      },
      {
        cellRenderer: CombinationCell,
        field: "targetCombination",
        flex: 1.25,
        headerName: "至",
        minWidth: 210,
      },
      {
        field: "reason",
        flex: 1.35,
        headerName: "原因",
        minWidth: 220,
      },
      {
        field: "operator",
        flex: 0.75,
        headerName: "操作人",
        minWidth: 104,
      },
      {
        field: "affected",
        flex: 0.9,
        headerName: "影响",
        minWidth: 132,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<RollbackRecord>>(
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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">回滚中心</h1>
            <p className="mt-2 text-slate-600 text-sm">一键回滚 · 影响评估 · 完整审计追踪</p>
          </div>
          <Button className="bg-red-600 hover:bg-red-700">
            <RotateCcw className="size-4" />
            紧急回滚
          </Button>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
              <AlertTriangle className="size-4" />
            </span>
            <div>
              <div className="font-semibold text-slate-900 text-sm">回滚操作不可撤销</div>
              <p className="mt-1 text-slate-600 text-sm">
                回滚会将目标环境切换到指定历史 Combination，影响范围请提前确认。重大回滚需双人审批。
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-3 xl:grid-cols-5">
          {snapshot.environments.map((environment) => (
            <EnvironmentCard key={environment.id} environment={environment} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-12">
          <Card className="rounded-lg p-0 shadow-none xl:col-span-8">
            <div className="flex items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
              <div>
                <h2 className="font-semibold text-slate-900 text-sm">
                  生产环境 · 历史 Combination
                </h2>
                <p className="mt-1 text-slate-500 text-xs">选择目标版本进行回滚</p>
              </div>
              <span className="text-slate-500 text-xs">选择目标版本进行回滚</span>
            </div>
            <div className="space-y-2 p-4">
              {snapshot.histories.map((history) => (
                <HistoryCombinationRow key={history.id} history={history} />
              ))}
            </div>
          </Card>

          <Card className="rounded-lg p-0 shadow-none xl:col-span-4">
            <div className="flex h-12 items-center border-slate-200 border-b px-4">
              <h2 className="font-semibold text-slate-900 text-sm">影响范围预览</h2>
            </div>
            <div className="space-y-4 p-4">
              <div className="text-slate-500 text-xs">选中：</div>
              <div className="font-mono font-semibold text-slate-900 text-sm">
                {snapshot.impact.selectedCombination}
              </div>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 font-semibold text-slate-800 text-xs">将变更的 Bundle</div>
                <div className="space-y-2">
                  {snapshot.impact.changes.map((change) => (
                    <div
                      key={change.module}
                      className="grid grid-cols-3 items-center gap-2 text-xs"
                    >
                      <span className="font-semibold text-slate-800">{change.module}</span>
                      <span className="font-mono font-semibold text-red-500">
                        {change.currentVersion}
                      </span>
                      <span className="flex items-center justify-end gap-1 font-mono font-semibold text-emerald-600">
                        <ArrowRight className="size-3 text-slate-400" />
                        {change.targetVersion}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 border-slate-200 border-t pt-3">
                <ImpactItem label="影响用户" value={snapshot.impact.affectedUsers} />
                <ImpactItem label="需重新下载" value={snapshot.impact.downloadSize} />
                <ImpactItem label="预计 CDN 流量" value={snapshot.impact.cdnTraffic} />
              </div>

              <Button className="w-full bg-red-600 hover:bg-red-700">
                <RotateCcw className="size-4" />
                确认回滚（需双人审批）
              </Button>
            </div>
          </Card>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex h-12 items-center border-slate-200 border-b px-4">
            <h2 className="font-semibold text-slate-900 text-sm">回滚记录</h2>
          </div>
          <AgGridReact<RollbackRecord>
            rowData={snapshot.records}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={50}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => `${data.time}-${data.fromCombination}`}
          />
        </section>
      </div>
    </>
  );
}

function EnvironmentCard({ environment }: { environment: RollbackEnvironmentState }) {
  return (
    <Card className="rounded-lg px-4 py-4 shadow-none">
      <div className="mb-4 flex items-center justify-between">
        <div className="font-semibold text-slate-950 text-base">
          {miCarEnvironmentShortLabels[environment.environment]}
        </div>
        <EnvironmentBadge environment={environment.environment}>当前</EnvironmentBadge>
      </div>
      <div className="font-medium text-slate-500 text-xs">当前 Combination</div>
      <div className="mt-2 rounded-md bg-slate-100 px-3 py-2 font-mono font-semibold text-slate-800 text-xs">
        {environment.currentCombination}
      </div>
      <div className="mt-3 text-slate-500 text-xs">
        在线 {environment.onlineUsers} · 自 {environment.since}
      </div>
      <Button
        variant="outline"
        type="button"
        className="mt-4 w-full border-red-200 bg-white text-red-500 text-xs hover:bg-red-50 hover:text-red-600"
      >
        <RotateCcw className="size-3.5" />
        回滚此环境
      </Button>
    </Card>
  );
}

function HistoryCombinationRow({ history }: { history: RollbackHistoryCombination }) {
  return (
    <Button
      variant="ghost"
      type="button"
      className={cn(
        "h-auto w-full justify-start rounded-md border px-3 py-3 text-left hover:bg-blue-50",
        history.isSelected || history.isCurrent
          ? "border-sky-200 bg-sky-50"
          : "border-slate-200 bg-white",
        history.status === "已回滚" ? "border-red-200 bg-red-50 hover:bg-red-50" : "",
      )}
    >
      <div className="grid w-full gap-3 md:grid-cols-12 md:items-center">
        <div className="min-w-0 md:col-span-4">
          <div className="truncate font-mono font-semibold text-slate-900 text-sm">
            {history.name}
          </div>
        </div>
        <div className="font-mono text-slate-500 text-xs md:col-span-2">{history.createdAt}</div>
        <div className="truncate text-slate-500 text-xs md:col-span-3">{history.description}</div>
        <div className="md:col-span-1">
          <RiskBadge risk={history.risk} />
        </div>
        <div className="flex justify-start md:col-span-2 md:justify-end">
          <CombinationStatusBadge status={history.status} />
        </div>
      </div>
    </Button>
  );
}

function ImpactItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function RiskBadge({ risk }: { risk: RollbackRisk }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        riskClass[risk],
      )}
    >
      {risk} risk
    </span>
  );
}

function CombinationStatusBadge({ status }: { status: RollbackCombinationStatus }) {
  const Icon: LucideIcon =
    status === "运行中" ? CheckCircle2 : status === "已回滚" ? ShieldAlert : History;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded border px-2 font-semibold text-xs leading-none",
        statusClass[status],
      )}
    >
      <Icon className="size-3.5" />
      {status === "可回滚" ? "回滚至此" : status}
    </span>
  );
}

function EnvironmentCell({ value }: ICellRendererParams<RollbackRecord, RollbackEnvironment>) {
  if (!value) {
    return null;
  }

  return <EnvironmentBadge environment={value} />;
}

function CombinationCell({ value }: ICellRendererParams<RollbackRecord, string>) {
  return value ? <span className="truncate font-mono text-slate-700 text-xs">{value}</span> : null;
}
