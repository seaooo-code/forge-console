import { Activity, ArchiveX, PenLine } from "lucide-react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { DetailList, PageHeader } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { ApplicationDetailFallback } from "./components/ApplicationDetailFallback";
import { ApplicationEnvironmentsGrid } from "./components/ApplicationEnvironmentsGrid";
import { ApplicationMembersSection } from "./components/ApplicationMembersSection";
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
  const jump = (label: string, value: string, onClick: () => void) => (
    <Button className="h-7 gap-1.5 rounded-lg px-2 font-normal" onClick={onClick} variant="ghost">
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </Button>
  );
  const moduleCount = String(application.moduleCount ?? detail.modules.length);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        onBack={onBack}
        backLabel="应用"
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            {application.name}
            <span
              className={cn(
                "inline-flex h-6 items-center rounded-md px-2 font-medium text-xs leading-none",
                applicationStatusClass[application.status],
              )}
            >
              {application.status}
            </span>
          </span>
        }
        description={
          <>
            <span className="font-mono text-xs">{application.slug}</span> · {application.platform} ·
            负责人 {application.owner || "-"}
            {detail.description ? ` · ${detail.description}` : ""}
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              disabled={!canEditApplication}
              onClick={() => onEditApplication(application.slug)}
            >
              <PenLine />
              编辑配置
            </Button>
            <Button
              variant={nextStatus === "offline" ? "danger-outline" : "outline"}
              disabled={!canUpdateStatus || isUpdatingStatus}
              onClick={openStatusDialog}
            >
              <StatusActionIcon />
              {isUpdatingStatus ? "处理中" : `${statusActionLabel}应用`}
            </Button>
          </>
        }
        below={
          <div className="flex flex-col gap-3">
            <div className="-ml-2 flex flex-wrap items-center gap-0.5 text-sm">
              {jump("个模块", moduleCount, () => onOpenApplicationModules(application.id))}
              {jump("个环境", String(detail.environments.length), () =>
                onOpenApplicationBuilds(application.id),
              )}
              <Button
                className="h-7 rounded-lg px-2 font-normal text-muted-foreground"
                onClick={() => onOpenApplicationBuilds(application.id)}
                variant="ghost"
              >
                查看构建
              </Button>
              <Button
                className="h-7 rounded-lg px-2 font-normal text-muted-foreground"
                onClick={() => onOpenApplicationReleases(application.id)}
                variant="ghost"
              >
                查看发布
              </Button>
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

      <Tabs defaultValue="integration">
        <TabsList>
          <TabsTrigger value="integration">接入</TabsTrigger>
          <TabsTrigger value="members">成员 · {detail.members.length}</TabsTrigger>
          <TabsTrigger value="environments">环境 · {detail.environments.length}</TabsTrigger>
          <TabsTrigger value="modules">模块 · {detail.modules.length}</TabsTrigger>
        </TabsList>

        <TabsContent value="integration" className="mt-5 flex flex-col gap-4">
          <section className="rounded-xl bg-card p-5 shadow-edge">
            <h2 className="m-0 mb-4 font-medium text-muted-foreground text-xs">接入凭证</h2>
            <DetailList
              items={[
                { hint: "客户端拉包时携带", label: "App Key", mono: true, value: detail.appKey },
                { label: "支持平台", value: application.platform },
              ]}
            />
          </section>
          <ClientIntegrationSection clientIntegration={detail.clientIntegration} />
        </TabsContent>

        <TabsContent value="members" className="mt-5">
          <ApplicationMembersSection
            applicationSlug={application.slug}
            canManageMembers={canManageMembers}
            members={detail.members}
            refreshApplicationDetail={refreshApplicationDetail}
            updateMembers={updateMembers}
          />
        </TabsContent>

        <TabsContent value="environments" className="mt-5">
          <ApplicationEnvironmentsGrid environments={detail.environments} />
        </TabsContent>

        <TabsContent value="modules" className="mt-5">
          <ApplicationModulesGrid modules={detail.modules} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
