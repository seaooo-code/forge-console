import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Activity,
  ArchiveX,
  ArrowLeft,
  Boxes,
  CircleAlert,
  type LucideIcon,
  MonitorSmartphone,
  PackageCheck,
  PenLine,
  RadioTower,
  Smartphone,
} from "lucide-react";
import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  applicationDetailQueryKey,
  applicationsRootQueryKey,
} from "./api/application-list-filters";
import {
  type ApplicationDetailAPIResponse,
  fetchApplicationDetailSnapshot,
  updateApplicationStatus,
} from "./api/applications-snapshot";
import { ClientIntegrationSection } from "./components/ClientIntegrationSection";
import {
  applicationEnvironmentStatusClass,
  applicationMetricToneClass,
  applicationModuleKindClass,
  applicationStatusClass,
} from "./constants";
import type {
  ApplicationDetailMetric,
  ApplicationEnvironmentRecord,
  ApplicationMemberRecord,
  ApplicationModuleRecord,
  ApplicationStatusCode,
} from "./types";

type ApplicationDetailPageProps = {
  applicationSlug: string;
  onBack: () => void;
  onEditApplication: (applicationSlug: string) => void;
};

export function ApplicationDetailPage({
  applicationSlug,
  onBack,
  onEditApplication,
}: ApplicationDetailPageProps) {
  const queryClient = useQueryClient();
  const { data: snapshot, isFetching } = useQuery({
    queryFn: () => fetchApplicationDetailSnapshot(applicationSlug),
    queryKey: applicationDetailQueryKey(applicationSlug),
  });
  const [overrideDetail, setOverrideDetail] = useState<ApplicationDetailAPIResponse | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState("");
  const application =
    overrideDetail?.application ??
    snapshot?.applications.find((item) => item.slug === applicationSlug);
  const detail = overrideDetail?.detail ?? snapshot?.details[applicationSlug];

  const environmentColumnDefs = useMemo<ColDef<ApplicationEnvironmentRecord>[]>(
    () => [
      {
        cellRenderer: EnvironmentCell,
        field: "environment",
        flex: 0.9,
        headerName: "环境",
        minWidth: 130,
      },
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
      {
        cellRenderer: ModuleCommonCell,
        field: "commonModuleName",
        flex: 0.9,
        headerName: "通用模块",
        minWidth: 130,
      },
      { field: "repository", flex: 1.6, headerName: "仓库", minWidth: 240 },
      { field: "owner", flex: 0.8, headerName: "负责人", minWidth: 120 },
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

  const statusActionLabel = application.status === "已下线" ? "上线" : "下线";
  const nextStatus: ApplicationStatusCode = application.status === "已下线" ? "running" : "offline";
  const StatusActionIcon = application.status === "已下线" ? Activity : ArchiveX;

  const handleUpdateApplicationStatus = async () => {
    setIsUpdatingStatus(true);
    setActionError("");

    try {
      const payload = await updateApplicationStatus(application.slug, nextStatus);
      setOverrideDetail(payload);
      setIsStatusDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: applicationsRootQueryKey });
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : `${statusActionLabel}应用失败，请稍后重试`,
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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
                  applicationStatusClass[application.status],
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

          <div className="space-y-3 xl:w-150">
            <div className="grid min-w-0 gap-2 text-sm md:grid-cols-2">
              <InfoPill icon={MonitorSmartphone} label="平台" value={application.platform} />
              <OwnerInfoPill
                avatarUrl={application.ownerAvatarUrl}
                email={application.ownerEmail}
                name={application.owner}
              />
              <InfoPill icon={PackageCheck} label="App Key" value={detail.appKey} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => onEditApplication(application.slug)}
              >
                <PenLine className="size-4" />
                编辑配置
              </Button>
              <Button
                variant="outline"
                type="button"
                className={cn(
                  nextStatus === "offline"
                    ? "border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700",
                )}
                disabled={isUpdatingStatus}
                onClick={() => {
                  setActionError("");
                  setIsStatusDialogOpen(true);
                }}
              >
                <StatusActionIcon className="size-4" />
                {isUpdatingStatus ? "处理中" : `${statusActionLabel}应用`}
              </Button>
            </div>
            {actionError ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 text-sm">
                {actionError}
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={isStatusDialogOpen}
        isPending={isUpdatingStatus}
        title={`${statusActionLabel}应用`}
        description={`确认${statusActionLabel}「${application.name}」？应用状态将更新为${nextStatus === "running" ? "运行中" : "已下线"}。`}
        confirmLabel={`${statusActionLabel}应用`}
        tone={nextStatus === "offline" ? "danger" : "default"}
        onCancel={() => {
          if (isUpdatingStatus) {
            return;
          }
          setIsStatusDialogOpen(false);
          setActionError("");
        }}
        onConfirm={() => {
          void handleUpdateApplicationStatus();
        }}
      >
        {actionError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-600 text-sm">
            {actionError}
          </div>
        ) : null}
      </ConfirmDialog>

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
              <ConfigItem icon={PackageCheck} label="App Key" value={detail.appKey} />
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

        <ClientIntegrationSection clientIntegration={detail.clientIntegration} />

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <TableHeader title="环境绑定" description="宿主应用已启用环境" />
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
        </section>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
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

function OwnerInfoPill({
  avatarUrl,
  email,
  name,
}: {
  avatarUrl: string;
  email: string;
  name: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <OwnerAvatar avatarUrl={avatarUrl} name={name} />
      <div className="min-w-0">
        <div className="text-slate-500 text-xs">负责人</div>
        <div className="truncate font-semibold text-slate-800 text-sm">{name}</div>
        {email ? <div className="truncate text-slate-500 text-xs">{email}</div> : null}
      </div>
    </div>
  );
}

function OwnerAvatar({ avatarUrl, name }: { avatarUrl: string; name: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="size-8 shrink-0 rounded-full object-cover" />;
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-rose-500 font-semibold text-white text-xs">
      {name.slice(0, 1).toUpperCase()}
    </span>
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
            applicationMetricToneClass[metric.tone],
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
        applicationEnvironmentStatusClass[value],
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
        applicationModuleKindClass[value],
      )}
    >
      {value}
    </span>
  );
}

function ModuleCommonCell({ data }: ICellRendererParams<ApplicationModuleRecord>) {
  if (!data || data.kind === "Common") {
    return <span className="text-slate-400 text-xs">-</span>;
  }

  return (
    <span className="truncate text-slate-700 text-sm">
      {data.commonModuleName || data.commonModuleId || "-"}
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
              <div className="mt-1 text-slate-500 text-sm">当前接口没有返回对应的宿主应用。</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
