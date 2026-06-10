import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Activity,
  AppWindow,
  ArchiveX,
  CircleDot,
  Download,
  MonitorSmartphone,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Smartphone,
  UserRound,
  Wrench,
} from "lucide-react";
import { useMemo } from "react";

import {
  ConsoleFilterSelect,
  ConsoleSearchInput,
  ConsoleTableFooter,
} from "@/components/common/ConsoleControls";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { themeQuartz } from "@/lib/ag-grid";
import { cn } from "@/lib/utils";

import type { ApplicationSummary, HostApplication } from "./types";

type ApplicationsPageProps = {
  applications: HostApplication[];
  isFetching: boolean;
  onRefresh: () => void;
  summary: ApplicationSummary;
};

const appStatusClass: Record<HostApplication["status"], string> = {
  已下线: "border-slate-200 bg-slate-50 text-slate-600",
  维护中: "border-amber-200 bg-amber-50 text-amber-700",
  运行中: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const appGridTheme = themeQuartz.withParams({
  accentColor: "#1677ff",
  backgroundColor: "#ffffff",
  borderColor: "#e5eaf2",
  borderRadius: 0,
  browserColorScheme: "light",
  columnBorder: false,
  fontFamily:
    '"Roboto Flex Variable", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif',
  fontSize: 13,
  foregroundColor: "#334155",
  headerBackgroundColor: "#f8fafc",
  headerFontSize: 12,
  headerFontWeight: 600,
  headerTextColor: "#64748b",
  oddRowBackgroundColor: "#ffffff",
  rowBorder: { color: "#e8edf5", style: "solid", width: 1 },
  rowHoverColor: "#f8fbff",
  selectedRowBackgroundColor: "#eff6ff",
  spacing: 7,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});

export function ApplicationsPage({
  applications,
  isFetching,
  onRefresh,
  summary,
}: ApplicationsPageProps) {
  const stats = useMemo(
    () => [
      {
        detail: "全部启用",
        icon: AppWindow,
        iconClass: "bg-blue-50 text-blue-600",
        id: "total",
        label: "应用总数",
        value: summary.total,
      },
      {
        detail: "75%",
        icon: Activity,
        iconClass: "bg-emerald-50 text-emerald-600",
        id: "running",
        label: "运行中",
        value: summary.running,
      },
      {
        detail: "25%",
        icon: Wrench,
        iconClass: "bg-amber-50 text-amber-600",
        id: "maintenance",
        label: "维护中",
        value: summary.maintenance,
      },
      {
        detail: "归档",
        icon: ArchiveX,
        iconClass: "bg-slate-100 text-slate-500",
        id: "offline",
        label: "已下线",
        value: summary.offline,
      },
    ],
    [summary],
  );

  const columnDefs = useMemo<ColDef<HostApplication>[]>(
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
        cellRenderer: AppNameCell,
        field: "name",
        flex: 1.45,
        headerName: "应用",
        minWidth: 260,
      },
      {
        field: "platform",
        flex: 1.05,
        headerName: "平台",
        minWidth: 210,
      },
      {
        field: "owner",
        flex: 0.8,
        headerName: "负责人",
        minWidth: 130,
      },
      {
        field: "moduleCount",
        flex: 0.55,
        headerName: "模块数",
        minWidth: 92,
      },
      {
        field: "environmentCount",
        flex: 0.55,
        headerName: "环境数",
        minWidth: 92,
      },
      {
        field: "createdAt",
        flex: 0.85,
        headerName: "创建时间",
        minWidth: 130,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.7,
        headerName: "状态",
        minWidth: 112,
      },
      {
        cellRenderer: ActionsCell,
        colId: "actions",
        flex: 0.75,
        headerName: "操作",
        minWidth: 132,
        sortable: false,
      },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef<HostApplication>>(
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
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">应用管理</h1>
          <p className="mt-2 text-slate-600 text-sm">管理 RN Bundle 平台接入的所有宿主应用</p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-4">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.id} className="rounded-lg px-5 py-4 shadow-none">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="font-medium text-slate-500 text-sm">{item.label}</div>
                    <div className="font-semibold text-3xl text-slate-950 leading-none">
                      {item.value}
                    </div>
                    <div className="font-medium text-slate-400 text-xs">{item.detail}</div>
                  </div>
                  <div
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg",
                      item.iconClass,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                </div>
              </Card>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-slate-200 border-b px-4 py-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <ConsoleFilterSelect
                icon={MonitorSmartphone}
                label="平台"
                value="all"
                options={[
                  { label: "全部平台", value: "all" },
                  { label: "iOS / Android", value: "ios-android" },
                  { label: "Android", value: "android" },
                ]}
              />
              <ConsoleFilterSelect
                icon={CircleDot}
                label="状态"
                value="all"
                options={[
                  { label: "全部状态", value: "all" },
                  { label: "运行中", value: "running" },
                  { label: "维护中", value: "maintenance" },
                  { label: "已下线", value: "offline" },
                ]}
              />
              <ConsoleFilterSelect
                icon={UserRound}
                label="负责人"
                value="all"
                options={[
                  { label: "全部负责人", value: "all" },
                  { label: "li.ming", value: "li.ming" },
                  { label: "wang.fang", value: "wang.fang" },
                  { label: "zhao.lei", value: "zhao.lei" },
                ]}
              />
              <ConsoleSearchInput />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="icon" aria-label="刷新应用列表" onClick={onRefresh}>
                <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
              </Button>
              <Button variant="outline" size="icon" aria-label="下载应用列表">
                <Download className="size-4" />
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="size-4" />
                新建应用
              </Button>
            </div>
          </div>

          <AgGridReact<HostApplication>
            rowData={applications}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={44}
            rowHeight={58}
            theme={appGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />

          <ConsoleTableFooter total={applications.length} />
        </section>
      </div>
    </>
  );
}

function CheckboxHeader() {
  return <Checkbox aria-label="选择全部应用" />;
}

function CheckboxCell() {
  return (
    <div className="flex h-full items-center">
      <Checkbox aria-label="选择应用" />
    </div>
  );
}

function AppNameCell({ data }: ICellRendererParams<HostApplication>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex h-full items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-rose-500 text-white shadow-sm">
        <Smartphone className="size-4" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold text-slate-900">{data.name}</div>
        <div className="font-mono text-slate-500 text-xs">{data.slug}</div>
      </div>
    </div>
  );
}

function StatusCell({ value }: ICellRendererParams<HostApplication, HostApplication["status"]>) {
  if (!value) {
    return null;
  }

  return (
    <div className="flex h-full items-center">
      <span
        className={cn(
          "inline-flex h-6 items-center rounded border px-2 font-medium text-xs leading-none",
          appStatusClass[value],
        )}
      >
        {value}
      </span>
    </div>
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
        配置
      </Button>
      <Button variant="ghost" type="button" size="icon" className="size-6 text-slate-500">
        <MoreHorizontal className="size-4" />
      </Button>
    </div>
  );
}
