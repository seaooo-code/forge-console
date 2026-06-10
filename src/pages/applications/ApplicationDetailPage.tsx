import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  ArrowLeft,
  Boxes,
  CircleAlert,
  GitBranch,
  Layers3,
  type LucideIcon,
  MonitorSmartphone,
  PackageCheck,
  RadioTower,
  ShieldCheck,
  Smartphone,
  UserRound,
} from "lucide-react";
import { useMemo } from "react";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { MockCard as Card, MockSurface } from "@/components/common/MockSurface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type {
  ApplicationDetailMetric,
  ApplicationEnvironmentRecord,
  ApplicationMemberRecord,
  ApplicationModuleRecord,
  ApplicationPipelineRecord,
  ApplicationStatus,
  ApplicationsSnapshot,
} from "./types";

type ApplicationDetailPageProps = {
  applicationSlug: string;
  isFetching: boolean;
  onBack: () => void;
  snapshot: ApplicationsSnapshot;
};

const appStatusClass: Record<ApplicationStatus, string> = {
  已下线: "border-slate-200 bg-slate-50 text-slate-600",
  维护中: "border-amber-200 bg-amber-50 text-amber-700",
  运行中: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const metricToneClass: Record<ApplicationDetailMetric["tone"], string> = {
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
};

const environmentStatusClass: Record<ApplicationEnvironmentRecord["status"], string> = {
  健康: "border-emerald-200 bg-emerald-50 text-emerald-700",
  灰度中: "border-amber-200 bg-amber-50 text-amber-700",
  维护中: "border-slate-200 bg-slate-50 text-slate-600",
};

const moduleKindClass: Record<ApplicationModuleRecord["kind"], string> = {
  Common: "border-amber-200 bg-amber-50 text-amber-700",
  Feature: "border-sky-200 bg-sky-50 text-sky-700",
};

const moduleStatusClass: Record<ApplicationModuleRecord["status"], string> = {
  冻结: "border-slate-200 bg-slate-50 text-slate-600",
  活跃: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const pipelineStatusClass: Record<ApplicationPipelineRecord["status"], string> = {
  failed: "border-red-200 bg-red-50 text-red-600",
  queued: "border-slate-200 bg-slate-50 text-slate-600",
  running: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function ApplicationDetailPage({
  applicationSlug,
  isFetching,
  onBack,
  snapshot,
}: ApplicationDetailPageProps) {
  const application = snapshot.applications.find((item) => item.slug === applicationSlug);
  const detail = snapshot.details[applicationSlug];

  const environmentColumnDefs = useMemo<ColDef<ApplicationEnvironmentRecord>[]>(
    () => [
      {
        cellRenderer: EnvironmentCell,
        field: "environment",
        flex: 0.9,
        headerName: "环境",
        minWidth: 130,
      },
      { field: "combination", flex: 1.8, headerName: "当前 Combination", minWidth: 260 },
      { field: "bundleCount", flex: 0.7, headerName: "Bundle 数", minWidth: 110 },
      { field: "traffic", flex: 0.85, headerName: "流量", minWidth: 120 },
      { field: "updatedAt", flex: 0.8, headerName: "更新", minWidth: 120 },
      {
        cellRenderer: EnvironmentStatusCell,
        field: "status",
        flex: 0.8,
        headerName: "状态",
        minWidth: 120,
      },
    ],
    [],
  );

  const moduleColumnDefs = useMemo<ColDef<ApplicationModuleRecord>[]>(
    () => [
      {
        cellRenderer: ModuleNameCell,
        field: "name",
        flex: 1.1,
        headerName: "模块",
        minWidth: 180,
      },
      {
        cellRenderer: ModuleKindCell,
        field: "kind",
        flex: 0.7,
        headerName: "类型",
        minWidth: 110,
      },
      { field: "repository", flex: 1.6, headerName: "仓库", minWidth: 240 },
      { field: "owner", flex: 0.8, headerName: "负责人", minWidth: 120 },
      { field: "pipeline", flex: 1.1, headerName: "流水线", minWidth: 170 },
      { field: "latestVersion", flex: 0.8, headerName: "线上版本", minWidth: 120 },
      {
        cellRenderer: ModuleStatusCell,
        field: "status",
        flex: 0.7,
        headerName: "状态",
        minWidth: 110,
      },
    ],
    [],
  );

  const pipelineColumnDefs = useMemo<ColDef<ApplicationPipelineRecord>[]>(
    () => [
      { field: "runId", flex: 0.7, headerName: "RUN ID", minWidth: 110 },
      { field: "moduleName", flex: 0.9, headerName: "模块", minWidth: 120 },
      { field: "branch", flex: 1.6, headerName: "分支", minWidth: 240 },
      {
        cellRenderer: PipelineStatusCell,
        field: "status",
        flex: 0.8,
        headerName: "状态",
        minWidth: 120,
      },
      { field: "duration", flex: 0.7, headerName: "耗时", minWidth: 110 },
      { field: "operator", flex: 0.8, headerName: "执行人", minWidth: 120 },
      { field: "startedAt", flex: 0.8, headerName: "开始", minWidth: 120 },
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

  if (!(application && detail)) {
    return <ApplicationDetailFallback isFetching={isFetching} onBack={onBack} />;
  }

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Button
              variant="ghost"
              type="button"
              className="-ml-2 mb-3 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
              返回应用管理
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white shadow-sm">
                <Smartphone className="size-5" />
              </div>
              <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">
                {application.name}
              </h1>
              <span
                className={cn(
                  "inline-flex h-6 items-center rounded border px-2 font-medium text-xs leading-none",
                  appStatusClass[application.status],
                )}
              >
                {application.status}
              </span>
              <Badge variant="outline" className="border-slate-200 font-mono text-slate-600">
                {application.slug}
              </Badge>
            </div>
            <p className="mt-2 text-slate-600 text-sm">{detail.description}</p>
          </div>

          <div className="grid min-w-0 gap-2 text-sm md:grid-cols-2 xl:w-150">
            <InfoPill icon={MonitorSmartphone} label="平台" value={application.platform} />
            <InfoPill icon={UserRound} label="负责人" value={application.owner} />
            <InfoPill icon={PackageCheck} label="App Key" value={detail.appKey} />
            <InfoPill icon={ShieldCheck} label="发布策略" value={detail.releasePolicy} />
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-4">
          {detail.metrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <div className="flex h-12 items-center border-slate-200 border-b px-4 font-semibold text-slate-900 text-sm">
              应用接入配置
            </div>
            <div className="grid gap-3 p-4 md:grid-cols-2">
              <ConfigItem icon={GitBranch} label="仓库组" value={detail.repositoryGroup} />
              <ConfigItem icon={Layers3} label="Bundle Namespace" value={detail.bundleNamespace} />
              <ConfigItem icon={Smartphone} label="包名" value={detail.packageName} />
              <ConfigItem icon={UserRound} label="归属团队" value={detail.ownerTeam} />
            </div>
          </Card>

          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <div className="flex h-12 items-center justify-between border-slate-200 border-b px-4">
              <div className="font-semibold text-slate-900 text-sm">成员权限</div>
              <Badge variant="outline" className="border-slate-200 text-slate-500">
                {detail.members.length} 人
              </Badge>
            </div>
            <div className="space-y-2 p-4">
              {detail.members.map((member) => (
                <MemberRow key={member.id} member={member} />
              ))}
            </div>
          </Card>
        </section>

        <MockSurface
          as="section"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <TableHeader title="环境绑定" description="宿主应用已启用环境与当前 Combination" />
          <AgGridReact<ApplicationEnvironmentRecord>
            rowData={detail.environments}
            columnDefs={environmentColumnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={46}
            rowHeight={54}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />
        </MockSurface>

        <MockSurface
          as="section"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <TableHeader title="接入模块" description="当前应用关联的 RN Bundle 模块" />
          <AgGridReact<ApplicationModuleRecord>
            rowData={detail.modules}
            columnDefs={moduleColumnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={46}
            rowHeight={58}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />
        </MockSurface>

        <MockSurface
          as="section"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <TableHeader title="最近流水线" description="应用维度最近 Pipeline Run" />
          <AgGridReact<ApplicationPipelineRecord>
            rowData={detail.pipelines}
            columnDefs={pipelineColumnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={46}
            rowHeight={54}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />
        </MockSurface>
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

function MetricCard({ metric }: { metric: ApplicationDetailMetric }) {
  return (
    <Card className="gap-3 rounded-lg border-slate-200 p-4 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-slate-500 text-xs">{metric.label}</div>
          <div className="mt-2 font-semibold text-2xl text-slate-950">{metric.value}</div>
        </div>
        <div
          className={cn(
            "flex size-8 items-center justify-center rounded-md",
            metricToneClass[metric.tone],
          )}
        >
          <RadioTower className="size-4" />
        </div>
      </div>
      <div className="text-slate-500 text-xs">{metric.detail}</div>
    </Card>
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

function MemberRow({ member }: { member: ApplicationMemberRecord }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2.5">
      <div className="min-w-0">
        <div className="truncate font-semibold text-slate-900 text-sm">{member.name}</div>
        <div className="mt-0.5 truncate text-slate-500 text-xs">{member.team}</div>
      </div>
      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
        {member.role}
      </Badge>
    </div>
  );
}

function TableHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex h-12 items-center justify-between border-slate-200 border-b px-4">
      <div>
        <div className="font-semibold text-slate-900 text-sm">{title}</div>
        <div className="text-slate-500 text-xs">{description}</div>
      </div>
    </div>
  );
}

function EnvironmentCell({
  value,
}: ICellRendererParams<ApplicationEnvironmentRecord, ApplicationEnvironmentRecord["environment"]>) {
  if (!value) {
    return null;
  }

  return <EnvironmentBadge environment={value} />;
}

function EnvironmentStatusCell({
  value,
}: ICellRendererParams<ApplicationEnvironmentRecord, ApplicationEnvironmentRecord["status"]>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        environmentStatusClass[value],
      )}
    >
      {value}
    </span>
  );
}

function ModuleNameCell({ data }: ICellRendererParams<ApplicationModuleRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-sky-50 text-sky-600">
        <Boxes className="size-3.5" />
      </div>
      <div className="min-w-0 font-semibold text-slate-900">{data.name}</div>
    </div>
  );
}

function ModuleKindCell({
  value,
}: ICellRendererParams<ApplicationModuleRecord, ApplicationModuleRecord["kind"]>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        moduleKindClass[value],
      )}
    >
      {value}
    </span>
  );
}

function ModuleStatusCell({
  value,
}: ICellRendererParams<ApplicationModuleRecord, ApplicationModuleRecord["status"]>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        moduleStatusClass[value],
      )}
    >
      {value}
    </span>
  );
}

function PipelineStatusCell({
  value,
}: ICellRendererParams<ApplicationPipelineRecord, ApplicationPipelineRecord["status"]>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        pipelineStatusClass[value],
      )}
    >
      {value}
    </span>
  );
}

function ApplicationDetailFallback({
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
        返回应用管理
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
              <div className="font-semibold text-slate-900">未找到应用详情</div>
              <div className="mt-1 text-slate-500 text-sm">
                当前 mock 数据中没有对应的宿主应用。
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
