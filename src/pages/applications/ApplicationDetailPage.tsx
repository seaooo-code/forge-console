import {
  Activity,
  ArchiveX,
  Boxes,
  MonitorSmartphone,
  PackageCheck,
  PenLine,
  RadioTower,
  Smartphone,
} from "lucide-react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageHeader, SectionCard } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { ApplicationDetailFallback } from "./components/ApplicationDetailFallback";
import { ConfigItem, InfoPill, OwnerInfoPill } from "./components/ApplicationDetailInfoPills";
import { ApplicationEnvironmentsGrid } from "./components/ApplicationEnvironmentsGrid";
import { ApplicationMembersSection } from "./components/ApplicationMembersSection";
import { MetricCard } from "./components/ApplicationMetricCard";
import { ApplicationModulesGrid } from "./components/ApplicationModulesGrid";
import { ClientIntegrationSection } from "./components/ClientIntegrationSection";
import { applicationStatusClass } from "./constants";
import { useApplicationDetail, useApplicationStatusToggle } from "./hooks";

type ApplicationDetailPageProps = {
  applicationSlug: string;
  onBack: () => void;
  onEditApplication: (applicationSlug: string) => void;
  onOpenApplicationBuilds: (applicationId: string) => void;
  onOpenApplicationModules: (applicationId: string) => void;
  onOpenApplicationReleases: (applicationId: string) => void;
};

export function ApplicationDetailPage({
  applicationSlug,
  onBack,
  onEditApplication,
  onOpenApplicationBuilds,
  onOpenApplicationModules,
  onOpenApplicationReleases,
}: ApplicationDetailPageProps) {
  const {
    application,
    detail,
    isFetching,
    refreshApplicationDetail,
    setOverrideDetail,
    updateMembers,
  } = useApplicationDetail(applicationSlug);
  const {
    actionError,
    closeStatusDialog,
    handleUpdateApplicationStatus,
    isStatusDialogOpen,
    isUpdatingStatus,
    nextStatus,
    openStatusDialog,
    statusActionLabel,
  } = useApplicationStatusToggle(application, setOverrideDetail);

  if (!(application && detail)) {
    return <ApplicationDetailFallback isFetching={isFetching} onBack={onBack} />;
  }

  const StatusActionIcon = application.status === "已下线" ? Activity : ArchiveX;
  const canEditApplication = detail.capabilities.canEditApplication;
  const canManageMembers = detail.capabilities.canManageMembers;
  const canUpdateStatus = detail.capabilities.canUpdateStatus;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        onBack={onBack}
        backLabel="返回应用管理"
        breadcrumbs={[{ label: "应用管理", href: "/apps" }, { label: application.name }]}
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex h-6 items-center rounded-md px-2 font-medium text-xs leading-none",
                applicationStatusClass[application.status],
              )}
            >
              {application.status}
            </span>
            <Badge variant="outline" className="font-mono text-muted-foreground">
              {application.slug}
            </Badge>
          </div>
        }
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Smartphone className="size-5" />
            </span>
            <span className="font-semibold text-2xl text-foreground tracking-tight">
              {application.name}
            </span>
          </span>
        }
        description={detail.description}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenApplicationModules(application.id)}
            >
              <Boxes className="size-3.5" />
              查看模块
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenApplicationBuilds(application.id)}
            >
              <PackageCheck className="size-3.5" />
              查看构建
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenApplicationReleases(application.id)}
            >
              <RadioTower className="size-3.5" />
              查看发布
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!canEditApplication}
              onClick={() => onEditApplication(application.slug)}
            >
              <PenLine className="size-3.5" />
              编辑配置
            </Button>
            <Button
              variant={nextStatus === "offline" ? "danger-outline" : "outline"}
              size="sm"
              disabled={!canUpdateStatus || isUpdatingStatus}
              onClick={openStatusDialog}
            >
              <StatusActionIcon className="size-3.5" />
              {isUpdatingStatus ? "处理中" : `${statusActionLabel}应用`}
            </Button>
          </>
        }
        below={
          <div className="flex flex-col gap-3">
            <div className="grid min-w-0 gap-2 text-sm md:grid-cols-3">
              <InfoPill icon={MonitorSmartphone} label="平台" value={application.platform} />
              <OwnerInfoPill
                avatarUrl={application.ownerAvatarUrl}
                email={application.ownerEmail}
                name={application.owner}
              />
              <InfoPill icon={PackageCheck} label="App Key" value={detail.appKey} />
            </div>
            {actionError ? <Alert variant="danger">{actionError}</Alert> : null}
          </div>
        }
      />
      <ConfirmDialog
        isOpen={isStatusDialogOpen}
        isPending={isUpdatingStatus}
        title={`${statusActionLabel}应用`}
        description={`确认${statusActionLabel}「${application.name}」？应用状态将更新为${nextStatus === "running" ? "运行中" : "已下线"}。`}
        confirmLabel={`${statusActionLabel}应用`}
        tone={nextStatus === "offline" ? "danger" : "default"}
        onCancel={closeStatusDialog}
        onConfirm={() => {
          void handleUpdateApplicationStatus();
        }}
      >
        {actionError ? <Alert variant="danger">{actionError}</Alert> : null}
      </ConfirmDialog>

      <section className="grid gap-3 xl:grid-cols-4">
        {detail.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="应用接入配置" description="接入 RN Bundle 平台所需的关键凭证">
          <div className="grid gap-3 md:grid-cols-2">
            <ConfigItem icon={PackageCheck} label="App Key" value={detail.appKey} />
          </div>
        </SectionCard>

        <ApplicationMembersSection
          applicationSlug={application.slug}
          canManageMembers={canManageMembers}
          members={detail.members}
          refreshApplicationDetail={refreshApplicationDetail}
          updateMembers={updateMembers}
        />
      </section>

      <ClientIntegrationSection clientIntegration={detail.clientIntegration} />

      <ApplicationEnvironmentsGrid environments={detail.environments} />

      <ApplicationModulesGrid modules={detail.modules} />
    </div>
  );
}
