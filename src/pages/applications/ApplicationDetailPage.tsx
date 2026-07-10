import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import {
  Activity,
  ArchiveX,
  Boxes,
  CircleAlert,
  type LucideIcon,
  MonitorSmartphone,
  PackageCheck,
  PenLine,
  Plus,
  RadioTower,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { searchFeishuUsers } from "@/api/feishu-user-search";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { OwnerPicker } from "@/components/common/OwnerPicker";
import { PageHeader, SectionCard } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { FeishuUserSearchResult } from "@/types/feishu";

import {
  applicationDetailQueryKey,
  applicationsRootQueryKey,
} from "./api/application-list-filters";
import {
  type ApplicationDetailAPIResponse,
  deleteApplicationMember,
  fetchApplicationDetailSnapshot,
  updateApplicationMemberRole,
  updateApplicationStatus,
  upsertApplicationMember,
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

type ApplicationMemberFormState = {
  memberName: string;
  role: ApplicationMemberRecord["role"];
  userId: string;
};

const applicationMemberRoleOptions: ReadonlyArray<{
  label: string;
  value: ApplicationMemberRecord["role"];
}> = [
  { label: "Owner", value: "Owner" },
  { label: "Developer", value: "Developer" },
  { label: "QA", value: "QA" },
  { label: "Release", value: "Release" },
];

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
  const queryClient = useQueryClient();
  const { data: snapshot, isFetching } = useQuery({
    queryFn: () => fetchApplicationDetailSnapshot(applicationSlug),
    queryKey: applicationDetailQueryKey(applicationSlug),
  });
  const [overrideDetail, setOverrideDetail] = useState<ApplicationDetailAPIResponse | null>(null);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState("");
  const [memberActionError, setMemberActionError] = useState("");
  const [isMutatingMember, setIsMutatingMember] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    member: ApplicationMemberRecord;
    role: ApplicationMemberRecord["role"];
  } | null>(null);
  const [deleteMemberTarget, setDeleteMemberTarget] = useState<ApplicationMemberRecord | null>(
    null,
  );
  const {
    control: memberFormControl,
    formState: { errors: memberFormErrors },
    handleSubmit: handleSubmitMemberForm,
    reset: resetMemberForm,
    setValue: setMemberFormValue,
    watch: watchMemberForm,
  } = useForm<ApplicationMemberFormState>({
    defaultValues: {
      memberName: "",
      role: "Developer",
      userId: "",
    },
  });
  const selectedMemberUserId = watchMemberForm("userId");
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
  const canEditApplication = detail.capabilities.canEditApplication;
  const canManageMembers = detail.capabilities.canManageMembers;
  const canUpdateStatus = detail.capabilities.canUpdateStatus;

  const updateMembers = (members: ApplicationMemberRecord[]) => {
    setOverrideDetail({
      application,
      detail: {
        ...detail,
        members,
      },
    });
  };

  const refreshApplicationDetail = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: applicationDetailQueryKey(application.slug) }),
      queryClient.invalidateQueries({ queryKey: applicationsRootQueryKey }),
    ]);
  };

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

  const handleAddMember = handleSubmitMemberForm(async (form) => {
    if (!canManageMembers) {
      return;
    }
    setIsMutatingMember(true);
    setMemberActionError("");

    try {
      const member = await upsertApplicationMember(application.slug, {
        role: form.role,
        userId: form.userId,
      });
      updateMembers(upsertMemberInList(detail.members, member));
      resetMemberForm({ memberName: "", role: "Developer", userId: "" });
      await refreshApplicationDetail();
    } catch (error) {
      setMemberActionError(error instanceof Error ? error.message : "添加成员失败，请稍后重试");
    } finally {
      setIsMutatingMember(false);
    }
  });

  const handleConfirmRoleChange = async () => {
    if (!roleChangeTarget) {
      return;
    }
    setIsMutatingMember(true);
    setMemberActionError("");

    try {
      const member = await updateApplicationMemberRole(
        application.slug,
        roleChangeTarget.member.userId,
        roleChangeTarget.role,
      );
      updateMembers(upsertMemberInList(detail.members, member));
      setRoleChangeTarget(null);
      await refreshApplicationDetail();
    } catch (error) {
      setMemberActionError(error instanceof Error ? error.message : "修改成员角色失败，请稍后重试");
    } finally {
      setIsMutatingMember(false);
    }
  };

  const handleConfirmDeleteMember = async () => {
    if (!deleteMemberTarget) {
      return;
    }
    setIsMutatingMember(true);
    setMemberActionError("");

    try {
      await deleteApplicationMember(application.slug, deleteMemberTarget.userId);
      updateMembers(detail.members.filter((member) => member.userId !== deleteMemberTarget.userId));
      setDeleteMemberTarget(null);
      await refreshApplicationDetail();
    } catch (error) {
      setMemberActionError(error instanceof Error ? error.message : "移除成员失败，请稍后重试");
    } finally {
      setIsMutatingMember(false);
    }
  };

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
                "inline-flex h-6 items-center rounded border px-2 font-medium text-xs leading-none",
                applicationStatusClass[application.status],
              )}
            >
              {application.status}
            </span>
            <Badge variant="outline" className="border-border font-mono text-muted-foreground">
              {application.slug}
            </Badge>
          </div>
        }
        title={
          <span className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
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
              onClick={() => {
                setActionError("");
                setIsStatusDialogOpen(true);
              }}
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

        <SectionCard
          title="成员权限"
          description="维护应用成员的角色与接入权限"
          actions={
            <Badge variant="outline" className="border-border text-muted-foreground">
              {detail.members.length} 人
            </Badge>
          }
        >
          <div className="space-y-3">
            {canManageMembers ? (
              <form className="space-y-2" onSubmit={handleAddMember}>
                <div className="grid gap-2 md:grid-cols-[1fr_8.5rem_auto]">
                  <Controller
                    control={memberFormControl}
                    name="memberName"
                    rules={{
                      validate: () => Boolean(selectedMemberUserId) || "请选择成员",
                    }}
                    render={({ field }) => (
                      <OwnerPicker<FeishuUserSearchResult>
                        value={field.value}
                        inputName={field.name}
                        inputRef={field.ref}
                        placeholder="搜索成员姓名、邮箱或账号"
                        searchUsers={searchFeishuUsers}
                        onBlur={field.onBlur}
                        onChange={(value) => {
                          field.onChange(value);
                          setMemberFormValue("userId", "", { shouldValidate: true });
                        }}
                        onSelect={(user) => {
                          setMemberFormValue("userId", user.id, { shouldValidate: true });
                        }}
                      />
                    )}
                  />
                  <Controller
                    control={memberFormControl}
                    name="role"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {applicationMemberRoleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={!selectedMemberUserId || isMutatingMember}
                    loading={isMutatingMember}
                  >
                    <Plus className="size-4" />
                    添加
                  </Button>
                </div>
                {memberFormErrors.memberName ? (
                  <div className="text-destructive text-xs">
                    {memberFormErrors.memberName.message}
                  </div>
                ) : null}
              </form>
            ) : null}
            {memberActionError ? <Alert variant="danger">{memberActionError}</Alert> : null}
            {detail.members.map((member) => (
              <MemberRow
                key={member.id}
                canManage={canManageMembers}
                disabled={isMutatingMember}
                member={member}
                onDelete={(target) => {
                  setMemberActionError("");
                  setDeleteMemberTarget(target);
                }}
                onRoleChange={(target, role) => {
                  if (target.role === role) {
                    return;
                  }
                  setMemberActionError("");
                  setRoleChangeTarget({ member: target, role });
                }}
              />
            ))}
          </div>
        </SectionCard>
      </section>

      <ClientIntegrationSection clientIntegration={detail.clientIntegration} />

      <SectionCard title="环境绑定" description="宿主应用已启用环境" padding="none">
        <div className="px-2 pb-2">
          <AgGridReact<ApplicationEnvironmentRecord>
            rowData={detail.environments}
            columnDefs={environmentColumnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={40}
            rowHeight={54}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />
        </div>
      </SectionCard>

      <SectionCard title="接入模块" description="当前应用关联的 RN Bundle 模块" padding="none">
        <div className="px-2 pb-2">
          <AgGridReact<ApplicationModuleRecord>
            rowData={detail.modules}
            columnDefs={moduleColumnDefs}
            defaultColDef={defaultColDef}
            domLayout="autoHeight"
            headerHeight={40}
            rowHeight={58}
            theme={consoleGridTheme}
            suppressCellFocus
            suppressContextMenu
            getRowId={({ data }) => data.id}
          />
        </div>
      </SectionCard>

      <ConfirmDialog
        isOpen={roleChangeTarget !== null}
        isPending={isMutatingMember}
        title="修改成员角色"
        description={
          roleChangeTarget
            ? `确认将「${memberDisplayName(roleChangeTarget.member)}」的角色修改为 ${roleChangeTarget.role}？`
            : ""
        }
        confirmLabel="修改角色"
        onCancel={() => {
          if (isMutatingMember) {
            return;
          }
          setRoleChangeTarget(null);
          setMemberActionError("");
        }}
        onConfirm={() => {
          void handleConfirmRoleChange();
        }}
      >
        {memberActionError ? <Alert variant="danger">{memberActionError}</Alert> : null}
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={deleteMemberTarget !== null}
        isPending={isMutatingMember}
        title="移除成员"
        description={
          deleteMemberTarget
            ? `确认移除「${memberDisplayName(deleteMemberTarget)}」的应用权限？`
            : ""
        }
        confirmLabel="移除成员"
        tone="danger"
        onCancel={() => {
          if (isMutatingMember) {
            return;
          }
          setDeleteMemberTarget(null);
          setMemberActionError("");
        }}
        onConfirm={() => {
          void handleConfirmDeleteMember();
        }}
      >
        {memberActionError ? <Alert variant="danger">{memberActionError}</Alert> : null}
      </ConfirmDialog>
    </div>
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
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">{label}</div>
        <div className="truncate font-semibold text-foreground text-sm">{value}</div>
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
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
      <OwnerAvatar avatarUrl={avatarUrl} name={name} />
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">负责人</div>
        <div className="truncate font-semibold text-foreground text-sm">{name}</div>
        {email ? <div className="truncate text-muted-foreground text-xs">{email}</div> : null}
      </div>
    </div>
  );
}

function OwnerAvatar({ avatarUrl, name }: { avatarUrl: string; name: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="size-8 shrink-0 rounded-full object-cover" />;
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function MetricCard({ metric }: { metric: ApplicationDetailMetric }) {
  return (
    <Card className="gap-3 rounded-lg border-border p-4 shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium text-muted-foreground text-xs">{metric.label}</div>
          <div className="mt-2 font-semibold text-2xl text-foreground">{metric.value}</div>
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
      <div className="text-muted-foreground text-xs">{metric.detail}</div>
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
    <div className="flex min-w-0 gap-3 rounded-md border border-border bg-card px-3 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-muted-foreground text-xs">{label}</div>
        <div className="mt-1 break-all font-semibold text-foreground text-sm">{value}</div>
      </div>
    </div>
  );
}

function MemberRow({
  canManage,
  disabled,
  member,
  onDelete,
  onRoleChange,
}: {
  canManage: boolean;
  disabled: boolean;
  member: ApplicationMemberRecord;
  onDelete: (member: ApplicationMemberRecord) => void;
  onRoleChange: (member: ApplicationMemberRecord, role: ApplicationMemberRecord["role"]) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <MemberAvatar member={member} />
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground text-sm">
            {memberDisplayName(member)}
          </div>
          <div className="mt-0.5 truncate text-muted-foreground text-xs">
            {member.email || member.team || member.userId}
          </div>
        </div>
      </div>
      {canManage ? (
        <div className="flex shrink-0 items-center gap-2">
          <Select
            value={member.role}
            disabled={disabled}
            onValueChange={(role) => onRoleChange(member, role as ApplicationMemberRecord["role"])}
          >
            <SelectTrigger className="h-8 w-30 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {applicationMemberRoleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={disabled}
            aria-label="移除成员权限"
            onClick={() => onDelete(member)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : (
        <Badge variant="outline" className="border-info/30 bg-info/10 text-info">
          {member.role}
        </Badge>
      )}
    </div>
  );
}

function MemberAvatar({ member }: { member: ApplicationMemberRecord }) {
  const name = memberDisplayName(member);
  if (member.avatarUrl) {
    return <img src={member.avatarUrl} alt={name} className="size-8 rounded-full object-cover" />;
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
      {name.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}

function memberDisplayName(member: ApplicationMemberRecord) {
  return member.name || member.email || member.userId || member.id;
}

function upsertMemberInList(
  members: ApplicationMemberRecord[],
  nextMember: ApplicationMemberRecord,
) {
  const existingIndex = members.findIndex((member) => member.userId === nextMember.userId);
  if (existingIndex < 0) {
    return [...members, nextMember];
  }

  return members.map((member, index) => (index === existingIndex ? nextMember : member));
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
      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-info/10 text-info">
        <Boxes className="size-3.5" />
      </div>
      <div className="min-w-0 font-semibold text-foreground">{data.name}</div>
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
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  return (
    <span className="truncate text-foreground text-sm">
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
    <div className="flex flex-col gap-6">
      <PageHeader onBack={onBack} backLabel="返回应用管理" title="应用详情" />
      <Card className="rounded-xl border-border p-6 shadow-xs">
        {isFetching ? (
          <div className="space-y-3">
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-32 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <div className="font-semibold text-foreground">未找到应用详情</div>
              <div className="mt-1 text-muted-foreground text-sm">
                当前接口没有返回对应的宿主应用。
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
