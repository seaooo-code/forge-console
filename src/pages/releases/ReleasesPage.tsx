import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Circle,
  Download,
  ListFilter,
  type LucideIcon,
  MoreHorizontal,
  PackageCheck,
  Plus,
  RefreshCw,
  Rocket,
  ShieldCheck,
  TimerReset,
  UserRound,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";

import {
  ConsoleFilterSelect,
  ConsoleSearchInput,
  ConsoleTableFooter,
} from "@/components/common/ConsoleControls";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { miCarEnvironmentFilterOptions } from "@/types/environments";

import type {
  ReleaseEnvironment,
  ReleaseRecord,
  ReleaseStatus,
  ReleasesSnapshot,
  ReleaseTimelineStatus,
} from "./types";

type ReleasesPageProps = {
  snapshot: ReleasesSnapshot;
};

const statusClass: Record<ReleaseStatus, string> = {
  已回滚: "border-red-200 bg-red-50 text-red-600",
  已完成: "border-emerald-200 bg-emerald-50 text-emerald-700",
  待审批: "border-amber-200 bg-amber-50 text-amber-700",
  灰度中: "border-orange-200 bg-orange-50 text-orange-700",
};

const timelineClass: Record<ReleaseTimelineStatus, string> = {
  done: "border-emerald-600 bg-emerald-600 text-white",
  pending: "border-slate-300 bg-white text-slate-300",
  running: "border-blue-600 bg-white text-blue-600",
};

export function ReleasesPage({ snapshot }: ReleasesPageProps) {
  const columnDefs = useMemo<ColDef<ReleaseRecord>[]>(
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
        cellRenderer: ReleaseCell,
        field: "id",
        flex: 1.18,
        headerName: "发布单",
        minWidth: 204,
      },
      {
        cellRenderer: EnvironmentCell,
        field: "environment",
        flex: 0.55,
        headerName: "目标环境",
        minWidth: 86,
      },
      {
        cellRenderer: CombinationCell,
        field: "combination",
        flex: 1.1,
        headerName: "COMBINATION",
        minWidth: 176,
      },
      {
        cellRenderer: GrayCell,
        field: "gray",
        flex: 0.55,
        headerName: "灰度",
        minWidth: 82,
      },
      {
        field: "owner",
        flex: 0.65,
        headerName: "负责人",
        minWidth: 92,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.65,
        headerName: "状态",
        minWidth: 92,
      },
      {
        field: "createdAt",
        flex: 0.84,
        headerName: "创建",
        minWidth: 116,
      },
      {
        field: "plannedAt",
        flex: 0.86,
        headerName: "计划发布",
        minWidth: 120,
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

  const defaultColDef = useMemo<ColDef<ReleaseRecord>>(
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
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">发布任务</h1>
          <p className="mt-2 text-slate-600 text-sm">
            只负责上线 · 不负责研发 · 严格的发布流程与灰度控制
          </p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-slate-200 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="truncate font-semibold text-slate-900 text-sm">
              {snapshot.focus.id} · {snapshot.focus.title}
            </div>
            <div className="flex shrink-0 items-center gap-3 text-slate-500 text-xs">
              <StatusBadge status={snapshot.focus.status}>
                {snapshot.focus.status} {snapshot.focus.grayPercent}%
              </StatusBadge>
              <span>
                {snapshot.focus.owner} · 计划 {snapshot.focus.plannedAt}
              </span>
            </div>
          </div>

          <div className="grid gap-3 border-slate-200 border-b p-4 xl:grid-cols-4">
            <InfoTile
              icon={Rocket}
              label="目标环境"
              title={snapshot.focus.environmentName}
              detail={snapshot.focus.environmentDetail}
              iconClass="bg-red-50 text-red-500"
            />
            <InfoTile
              icon={PackageCheck}
              label="Combination"
              title={snapshot.focus.combination}
              detail={snapshot.focus.combinationDetail}
              iconClass="bg-slate-100 text-slate-500"
            />
            <Card className="rounded-lg border-slate-200 bg-slate-50 p-4 shadow-none">
              <div className="mb-2 flex items-center justify-between">
                <div className="font-medium text-slate-500 text-xs">灰度配置</div>
                <div className="font-semibold text-slate-900 text-sm">
                  {snapshot.focus.grayPercent}%
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${snapshot.focus.grayPercent}%` }}
                />
              </div>
              <div className="mt-2 font-medium text-slate-500 text-xs">
                {snapshot.focus.grayDetail}
              </div>
            </Card>
            <InfoTile
              icon={ShieldCheck}
              label="审批 & 通知"
              title={snapshot.focus.approvalStatus}
              detail={snapshot.focus.approvalChannels}
              iconClass="bg-emerald-50 text-emerald-600"
            />
          </div>

          <div className="px-4 py-4">
            <div className="mb-3 font-semibold text-slate-900 text-sm">发布时间线</div>
            <div className="space-y-0.5">
              {snapshot.focus.timeline.map((item, index) => (
                <div key={item.id} className="flex items-center">
                  <div className="w-24 shrink-0 font-mono text-slate-600 text-xs">{item.time}</div>
                  <div className="relative flex h-8 w-9 shrink-0 items-center justify-center">
                    {index < snapshot.focus.timeline.length - 1 ? (
                      <div className="absolute top-4 left-1/2 h-8 w-px bg-slate-200" />
                    ) : null}
                    <span
                      className={cn(
                        "relative z-10 flex size-3.5 items-center justify-center rounded-full border-2",
                        timelineClass[item.status],
                      )}
                    >
                      {item.status === "running" ? (
                        <Circle className="size-1.5 fill-current" />
                      ) : null}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "min-w-0 flex-1 font-medium text-sm",
                      item.status === "pending" ? "text-slate-400" : "text-slate-800",
                    )}
                  >
                    {item.label}
                  </div>
                  <div className="w-28 shrink-0 text-right font-medium text-slate-500 text-xs">
                    {item.actor}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
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
                  { label: "灰度中", value: "gray" },
                  { label: "已完成", value: "done" },
                  { label: "待审批", value: "approval" },
                  { label: "已回滚", value: "rollback" },
                ]}
              />
              <ConsoleFilterSelect
                icon={UserRound}
                label="负责人"
                value="all"
                options={[
                  { label: "全部负责人", value: "all" },
                  { label: "li.ming", value: "li.ming" },
                  { label: "release.bot", value: "release.bot" },
                  { label: "qa.zhao", value: "qa.zhao" },
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
              <Button variant="outline" size="icon" aria-label="刷新发布任务">
                <RefreshCw className="size-4" />
              </Button>
              <Button variant="outline" size="icon" aria-label="下载发布任务">
                <Download className="size-4" />
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="size-4" />
                新建发布单
              </Button>
            </div>
          </div>

          <AgGridReact<ReleaseRecord>
            rowData={snapshot.releases}
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

          <ConsoleTableFooter total={snapshot.releases.length} />
        </section>
      </div>
    </>
  );
}

type InfoTileProps = {
  detail: string;
  icon: LucideIcon;
  iconClass: string;
  label: string;
  title: string;
};

function InfoTile({ detail, icon: Icon, iconClass, label, title }: InfoTileProps) {
  return (
    <Card className="rounded-lg border-slate-200 bg-slate-50 p-4 shadow-none">
      <div className="mb-3 font-medium text-slate-500 text-xs">{label}</div>
      <div className="flex items-center gap-3">
        <span
          className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", iconClass)}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <div className="truncate font-semibold text-slate-950 text-base">{title}</div>
          <div className="mt-1 font-medium text-slate-500 text-xs">{detail}</div>
        </div>
      </div>
    </Card>
  );
}

function CheckboxHeader() {
  return <Checkbox aria-label="选择全部发布任务" />;
}

function CheckboxCell() {
  return (
    <div className="flex h-full items-center">
      <Checkbox aria-label="选择发布任务" />
    </div>
  );
}

function ReleaseCell({ data }: ICellRendererParams<ReleaseRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="min-w-0 leading-tight">
      <div className="truncate font-semibold text-blue-600 text-sm">{data.id}</div>
      <div className="mt-1 truncate text-slate-600 text-xs">{data.title}</div>
    </div>
  );
}

function EnvironmentCell({ value }: ICellRendererParams<ReleaseRecord, ReleaseEnvironment>) {
  if (!value) {
    return null;
  }

  return <EnvironmentBadge environment={value} />;
}

function CombinationCell({ value }: ICellRendererParams<ReleaseRecord, string>) {
  return value ? <span className="truncate font-mono text-slate-700 text-xs">{value}</span> : null;
}

function GrayCell({ value }: ICellRendererParams<ReleaseRecord, string>) {
  if (!value || value === "—") {
    return <span className="text-slate-400">—</span>;
  }

  return <span className="font-semibold text-slate-800 text-xs">{value}</span>;
}

function StatusCell({ value }: ICellRendererParams<ReleaseRecord, ReleaseStatus>) {
  return value ? <StatusBadge status={value}>{value}</StatusBadge> : null;
}

function StatusBadge({ children, status }: { children: ReactNode; status: ReleaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        statusClass[status],
      )}
    >
      {children}
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
        日志
      </Button>
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-red-500 text-xs hover:text-red-600"
      >
        回滚
      </Button>
      <Button variant="ghost" type="button" size="icon" className="size-6 text-slate-500">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
