import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  ArrowLeft,
  Boxes,
  CircleAlert,
  Clock3,
  Cloud,
  GitBranch,
  type LucideIcon,
  PackageCheck,
  RadioTower,
  ShieldCheck,
  TimerReset,
} from "lucide-react";
import { useMemo } from "react";

import { miCarEnvironmentBadgeClass } from "@/components/common/EnvironmentBadge";
import { MockSurface } from "@/components/common/MockSurface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { themeQuartz } from "@/lib/ag-grid";
import { cn } from "@/lib/utils";

import type {
  EnvironmentBundleRow,
  EnvironmentCode,
  EnvironmentGuardrail,
  EnvironmentStatus,
  EnvironmentsSnapshot,
  EnvironmentTimelineItem,
} from "./types";

type EnvironmentDetailPageProps = {
  environmentId: EnvironmentCode;
  isFetching: boolean;
  onBack: () => void;
  snapshot: EnvironmentsSnapshot;
};

const statusClass: Record<EnvironmentStatus, string> = {
  健康: "border-emerald-200 bg-emerald-50 text-emerald-700",
  灰度中: "border-amber-200 bg-amber-50 text-amber-700",
};

const guardrailClass: Record<EnvironmentGuardrail["status"], string> = {
  关注: "border-amber-200 bg-amber-50 text-amber-700",
  通过: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const timelineStatusClass: Record<EnvironmentTimelineItem["status"], string> = {
  成功: "border-emerald-200 bg-emerald-50 text-emerald-700",
  等待: "border-slate-200 bg-slate-50 text-slate-500",
  进行中: "border-blue-200 bg-blue-50 text-blue-700",
};

const environmentDetailGridTheme = themeQuartz.withParams({
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

export function EnvironmentDetailPage({
  environmentId,
  isFetching,
  onBack,
  snapshot,
}: EnvironmentDetailPageProps) {
  const environment = snapshot.environments.find((item) => item.id === environmentId);
  const detail = snapshot.details[environmentId];

  const bundleColumnDefs = useMemo<ColDef<EnvironmentBundleRow>[]>(
    () => [
      {
        cellRenderer: BundleModuleCell,
        field: "moduleName",
        flex: 1.3,
        headerName: "模块",
        minWidth: 190,
      },
      {
        cellRenderer: VersionCell,
        cellRendererParams: { environmentId },
        field: "version",
        flex: 0.8,
        headerName: "版本",
        minWidth: 130,
      },
      { field: "size", flex: 0.75, headerName: "体积", minWidth: 110 },
      { field: "build", flex: 0.75, headerName: "BUILD", minWidth: 110 },
      {
        cellRenderer: BranchCell,
        field: "branch",
        flex: 1.35,
        headerName: "分支",
        minWidth: 210,
      },
      { field: "owner", flex: 0.8, headerName: "负责人", minWidth: 120 },
      {
        cellRenderer: BundleStatusCell,
        field: "status",
        flex: 0.75,
        headerName: "状态",
        minWidth: 110,
      },
    ],
    [environmentId],
  );

  const timelineColumnDefs = useMemo<ColDef<EnvironmentTimelineItem>[]>(
    () => [
      { field: "time", flex: 0.8, headerName: "时间", minWidth: 120 },
      { field: "action", flex: 1, headerName: "操作", minWidth: 160 },
      { field: "operator", flex: 0.9, headerName: "操作人", minWidth: 130 },
      {
        cellRenderer: TimelineStatusCell,
        field: "status",
        flex: 0.75,
        headerName: "状态",
        minWidth: 110,
      },
      { field: "detail", flex: 2, headerName: "说明", minWidth: 280 },
    ],
    [],
  );

  const defaultColDef = useMemo(
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

  if (!(environment && detail)) {
    return <EnvironmentDetailFallback isFetching={isFetching} onBack={onBack} />;
  }

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3">
              <Button
                variant="ghost"
                type="button"
                className="-ml-2 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                onClick={onBack}
              >
                <ArrowLeft className="size-4" />
                返回环境管理
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">
                {environment.name}
              </h1>
              <span
                className={cn(
                  "inline-flex h-6 items-center rounded border px-2 font-medium text-xs leading-none",
                  statusClass[environment.status],
                )}
              >
                {environment.status}
              </span>
              <span
                className={cn(
                  "inline-flex h-6 items-center rounded border px-2 font-mono font-semibold text-xs leading-none",
                  miCarEnvironmentBadgeClass[environment.id],
                )}
              >
                {environment.code}
              </span>
            </div>
            <p className="mt-2 text-slate-600 text-sm">{environment.description}</p>
          </div>

          <div className="grid min-w-0 gap-2 text-sm md:grid-cols-2 xl:w-150">
            <InfoPill
              icon={PackageCheck}
              label="当前 Combination"
              value={environment.currentCombination}
            />
            <InfoPill icon={RadioTower} label="当前发布" value={detail.currentRelease} />
            <InfoPill icon={Cloud} label="CDN 域名" value={detail.cdnDomain} />
            <InfoPill icon={TimerReset} label="最近更新" value={environment.updatedAt} />
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        {/* TODO: environment_metrics 服务端能力已移除，后续接入 telemetry/监控数据源后恢复指标卡片。 */}

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <CardHeader className="flex h-12 flex-row items-center justify-between border-slate-200 border-b px-4 py-0">
              <CardTitle className="font-semibold text-slate-900 text-sm">运行配置</CardTitle>
              <Badge variant="outline" className="border-slate-200 text-slate-500">
                {detail.bundleCount} 个 Bundle · {detail.totalSize}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 md:grid-cols-2">
              <ConfigItem icon={Cloud} label="访问入口" value={detail.endpoint} />
              <ConfigItem icon={GitBranch} label="分支策略" value={detail.branchPolicy} />
              <ConfigItem icon={ShieldCheck} label="发布策略" value={detail.releasePolicy} />
              <ConfigItem icon={Clock3} label="刷新周期" value="18 秒自动刷新 · 支持手动刷新" />
            </CardContent>
          </Card>

          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <CardHeader className="h-12 justify-center border-slate-200 border-b px-4">
              <CardTitle className="font-semibold text-slate-900 text-sm">准入检查</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4">
              {detail.guardrails.map((guardrail) => (
                <div
                  key={guardrail.id}
                  className="flex items-start justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-sm">{guardrail.label}</div>
                    <div className="mt-1 text-slate-500 text-xs">{guardrail.value}</div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex h-6 shrink-0 items-center rounded border px-2 font-semibold text-xs leading-none",
                      guardrailClass[guardrail.status],
                    )}
                  >
                    {guardrail.status}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <MockSurface
          as="section"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <Card className="gap-0 rounded-none border-0 py-0 shadow-none">
            <CardHeader className="flex h-12 flex-row items-center justify-between border-slate-200 border-b px-4 py-0">
              <CardTitle className="font-semibold text-slate-900 text-sm">
                当前 Bundle 组成
              </CardTitle>
              <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                {environment.currentCombination}
              </Badge>
            </CardHeader>
            <CardContent className="px-0 py-0">
              <AgGridReact<EnvironmentBundleRow>
                rowData={detail.bundles}
                columnDefs={bundleColumnDefs}
                defaultColDef={defaultColDef}
                domLayout="autoHeight"
                headerHeight={46}
                rowHeight={58}
                theme={environmentDetailGridTheme}
                suppressCellFocus
                suppressContextMenu
                getRowId={({ data }) => data.id}
              />
            </CardContent>
          </Card>
        </MockSurface>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <Card className="gap-0 rounded-none border-0 py-0 shadow-none">
            <CardHeader className="h-12 justify-center border-slate-200 border-b px-4">
              <CardTitle className="font-semibold text-slate-900 text-sm">最近变更记录</CardTitle>
            </CardHeader>
            <CardContent className="px-0 py-0">
              <AgGridReact<EnvironmentTimelineItem>
                rowData={detail.timeline}
                columnDefs={timelineColumnDefs}
                defaultColDef={defaultColDef}
                domLayout="autoHeight"
                headerHeight={46}
                rowHeight={52}
                theme={environmentDetailGridTheme}
                suppressCellFocus
                suppressContextMenu
                getRowId={({ data }) => data.id}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </>
  );
}

function InfoPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <Icon className="size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <div className="text-slate-500 text-xs">{label}</div>
        <div className="truncate font-semibold text-slate-800 text-sm">{value}</div>
      </div>
    </div>
  );
}

function ConfigItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-md border border-slate-200 bg-white px-3 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-slate-500 text-xs">{label}</div>
        <div className="mt-1 break-all font-semibold text-slate-800 text-sm">{value}</div>
      </div>
    </div>
  );
}

function BundleModuleCell({ data }: ICellRendererParams<EnvironmentBundleRow>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600">
        <Boxes className="size-3.5" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="truncate font-semibold text-slate-900">{data.moduleName}</div>
        <div className="text-slate-500 text-xs">{data.moduleType}</div>
      </div>
    </div>
  );
}

function VersionCell({
  value,
  environmentId,
}: ICellRendererParams<EnvironmentBundleRow, string> & {
  environmentId?: EnvironmentCode;
}) {
  if (!(value && environmentId)) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 font-mono font-semibold text-xs",
        miCarEnvironmentBadgeClass[environmentId],
      )}
    >
      {value}
    </span>
  );
}

function BranchCell({ value }: ICellRendererParams<EnvironmentBundleRow, string>) {
  if (!value) {
    return null;
  }

  return <span className="truncate font-mono text-slate-700 text-xs">{value}</span>;
}

function BundleStatusCell({ value }: ICellRendererParams<EnvironmentBundleRow, string>) {
  if (!value) {
    return null;
  }

  const className =
    value === "灰度中"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : value === "待验证"
        ? "border-blue-200 bg-blue-50 text-blue-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700";

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        className,
      )}
    >
      {value}
    </span>
  );
}

function TimelineStatusCell({ value }: ICellRendererParams<EnvironmentTimelineItem, string>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        timelineStatusClass[value as EnvironmentTimelineItem["status"]],
      )}
    >
      {value}
    </span>
  );
}

function EnvironmentDetailFallback({
  isFetching,
  onBack,
}: {
  isFetching: boolean;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4 px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回环境管理
      </Button>

      <Card className="rounded-lg border-slate-200 p-6 shadow-none">
        {isFetching ? (
          <div className="space-y-3">
            <div className="h-5 w-36 animate-pulse rounded bg-slate-100" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-32 w-full animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <div>
              <div className="font-semibold text-slate-900">未找到环境详情</div>
              <div className="mt-1 text-slate-500 text-sm">
                当前项目只支持 dev、staging、preview、preProduct、product 五个环境。
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
