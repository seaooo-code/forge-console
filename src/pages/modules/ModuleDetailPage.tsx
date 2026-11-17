import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Blocks,
  Box,
  Boxes,
  CircleAlert,
  Clock,
  ExternalLink,
  FileCode2,
  FolderTree,
  GitBranch,
  GitFork,
  Hammer,
  KeyRound,
  LayoutList,
  Package,
  PenLine,
  Rocket,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import { buildAdapterDetailQueryKey, fetchBuildAdapter } from "@/api/build-adapters";
import { buildsSnapshotQueryKey, createBuild } from "@/api/builds";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { environmentsSnapshotQueryKey, fetchEnvironmentsSnapshot } from "@/pages/environments";
import { fetchAllReleaseRecordsSnapshot, releaseRecordsAllQueryKey } from "@/pages/release-records";
import { useAuthStore } from "@/store/use-auth-store";

import { fetchModuleDetailSnapshot, moduleDetailQueryKey } from "./api/modules-snapshot";
import { CodeSourceProviderIcon } from "./components/CodeSourceProviderIcon";
import { ModuleBuildDialog } from "./components/ModuleBuildDialog";
import { ModuleBuildVariablesPanel } from "./components/ModuleBuildVariablesPanel";
import { ModuleWebhookPanel } from "./components/ModuleWebhookPanel";
import { PublishedBuildsPanel } from "./components/PublishedBuildsPanel";
import { buildModeLabels, codeSourceProviderLabels, kindClass } from "./constants";
import type { ModuleRecord } from "./types";
import { formatCommonModule } from "./utils";

type ModuleDetailPageProps = {
  moduleId: string;
  onBack: () => void;
  onEditModule: (moduleId: string) => void;
  onOpenBuildAdapter: (adapterId: string) => void;
};

export function ModuleDetailPage({
  moduleId,
  onBack,
  onEditModule,
  onOpenBuildAdapter,
}: ModuleDetailPageProps) {
  const queryClient = useQueryClient();
  const { data: snapshot, isFetching } = useQuery({
    queryFn: () => fetchModuleDetailSnapshot(moduleId),
    queryKey: moduleDetailQueryKey(moduleId),
  });
  const { data: environmentSnapshot, isFetching: isEnvironmentsFetching } = useQuery({
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });
  const releaseRecordsFilters = useMemo(() => ({ moduleId }), [moduleId]);
  const { data: releaseRecordsSnapshot, isFetching: isReleaseRecordsFetching } = useQuery({
    queryFn: () => fetchAllReleaseRecordsSnapshot(releaseRecordsFilters),
    queryKey: releaseRecordsAllQueryKey(releaseRecordsFilters),
  });
  const canManageModules = Boolean(
    useAuthStore((state) => state.session?.capabilities.canManageModules),
  );
  const [activeTab, setActiveTab] = useState<"overview" | "variables">("overview");
  const [isBuildDialogOpen, setIsBuildDialogOpen] = useState(false);
  const [buildError, setBuildError] = useState("");
  const [buildSuccess, setBuildSuccess] = useState("");
  const module = snapshot?.modules[0];
  const releaseRecords = releaseRecordsSnapshot?.records ?? [];
  const environmentOptions = useMemo(
    () =>
      environmentSnapshot?.environments.map((environment) => ({
        label: environment.name,
        value: environment.id,
      })) ?? [],
    [environmentSnapshot],
  );

  if (!module) {
    return <ModuleDetailFallback isFetching={isFetching} onBack={onBack} />;
  }

  const ModuleIcon = module.kind === "Common" ? Box : Package;

  return (
    <>
      <div className="border-border border-b bg-card px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Button
              variant="ghost"
              type="button"
              className="-ml-2 mb-3 h-8 gap-2 px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
              返回模块管理
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-lg shadow-sm",
                  module.kind === "Common"
                    ? "bg-warning text-warning-foreground"
                    : "bg-info text-info-foreground",
                )}
              >
                <ModuleIcon className="size-5" />
              </div>
              <h1 className="font-semibold text-2xl text-foreground tracking-tight">
                {module.name}
              </h1>
              <span
                className={cn(
                  "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
                  kindClass[module.kind],
                )}
              >
                {module.kind}
              </span>
              <Badge variant="outline" className="border-border font-mono text-muted-foreground">
                {module.id}
              </Badge>
            </div>
            <p className="mt-2 text-muted-foreground text-sm">
              {module.kind === "Common"
                ? "通用模块提供应用内功能模块的基础依赖。"
                : "功能模块绑定宿主应用，并依赖同应用下的通用模块。"}
            </p>
          </div>

          <div className="space-y-3 xl:w-150">
            <div className="grid min-w-0 gap-2 text-sm md:grid-cols-2">
              <InfoPill icon={Boxes} label="关联应用" value={module.applicationName || "-"} />
              <OwnerInfoPill module={module} />
              <InfoPill icon={GitFork} label="默认分支" value={module.defaultBranch || "-"} />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  setBuildError("");
                  setBuildSuccess("");
                  setIsBuildDialogOpen(true);
                }}
              >
                <Hammer className="size-4" />
                构建
              </Button>
              <Button variant="outline" type="button" onClick={() => onEditModule(module.id)}>
                <PenLine className="size-4" />
                编辑配置
              </Button>
            </div>
            {buildSuccess ? <Alert variant="success">{buildSuccess}</Alert> : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <div className="flex gap-1 border-border border-b" role="tablist">
          <TabButton
            icon={LayoutList}
            isActive={activeTab === "overview"}
            label="概览"
            onClick={() => setActiveTab("overview")}
          />
          <TabButton
            icon={KeyRound}
            isActive={activeTab === "variables"}
            label="构建变量"
            onClick={() => setActiveTab("variables")}
          />
        </div>

        {activeTab === "overview" ? (
          <>
            <section className="grid gap-4 xl:grid-cols-2">
              <RepositoryCard module={module} />
              <BuildConfigCard
                environmentName={
                  environmentOptions.find(
                    (option) => option.value === module.buildConfig.autoBuildEnvironment,
                  )?.label
                }
                module={module}
                onOpenBuildAdapter={onOpenBuildAdapter}
              />
              <ModuleWebhookPanel module={module} />
              <Card className="gap-0 rounded-lg py-0">
                <SectionHeader title="模块关系" description="应用归属与通用模块依赖" />
                <div className="grid gap-3 p-4">
                  <DetailItem icon={Boxes} label="关联应用" value={module.applicationName} />
                  <DetailItem icon={Boxes} label="应用 ID" value={module.applicationId} />
                  <DetailItem icon={Package} label="通用模块" value={formatCommonModule(module)} />
                </div>
              </Card>
            </section>

            <PublishedBuildsPanel isFetching={isReleaseRecordsFetching} records={releaseRecords} />
          </>
        ) : (
          <ModuleBuildVariablesPanel
            canManage={canManageModules}
            environmentOptions={environmentOptions}
            moduleId={module.id}
          />
        )}
      </div>

      <ModuleBuildDialog
        environmentOptions={environmentOptions}
        isEnvironmentsFetching={isEnvironmentsFetching}
        isOpen={isBuildDialogOpen}
        module={module}
        submitError={buildError}
        onClose={() => {
          setIsBuildDialogOpen(false);
          setBuildError("");
        }}
        onSubmit={async (form) => {
          setBuildError("");
          setBuildSuccess("");

          try {
            const build = await createBuild({
              branch: form.branch.trim(),
              environment: form.environment,
              moduleId: module.id,
            });
            setBuildSuccess(`构建 #${build.number} 已提交：${build.createdAt}`);
            setIsBuildDialogOpen(false);
            await queryClient.invalidateQueries({ queryKey: buildsSnapshotQueryKey() });
          } catch (error) {
            setBuildError(error instanceof Error ? error.message : "提交构建失败，请稍后重试");
          }
        }}
      />
    </>
  );
}

function TabButton({
  icon: Icon,
  isActive,
  label,
  onClick,
}: {
  icon: LucideIcon;
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      role="tab"
      aria-selected={isActive}
      className={cn(
        "-mb-px h-9 gap-1.5 rounded-none border-b-2 px-3",
        isActive
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
      onClick={onClick}
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
}

function RepositoryCard({ module }: { module: ModuleRecord }) {
  return (
    <Card className="gap-0 rounded-lg py-0">
      <SectionHeader title="仓库绑定" description="代码源连接、仓库与默认分支" />
      <div className="grid gap-3 p-4 md:grid-cols-2">
        <DetailItem
          icon={GitFork}
          label="仓库"
          wide
          value={
            module.repositoryWebUrl ? (
              <a
                href={module.repositoryWebUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                {module.repositoryFullName}
                <ExternalLink className="size-3.5" />
              </a>
            ) : (
              module.repositoryFullName
            )
          }
        />
        <DetailItem
          icon={GitFork}
          label="代码源连接"
          value={
            <span className="inline-flex items-center gap-1.5">
              <CodeSourceProviderIcon provider={module.repositoryProvider} />
              {module.codeSourceConnectionName || module.codeSourceConnectionId}
              <span className="font-normal text-muted-foreground text-xs">
                {codeSourceProviderLabels[module.repositoryProvider]}
              </span>
            </span>
          }
        />
        <DetailItem icon={GitBranch} label="默认分支" value={module.defaultBranch ?? ""} />
        <DetailItem icon={GitFork} label="仓库 ID" value={module.repositoryId} />
        <DetailItem icon={GitFork} label="Clone URL" value={module.repositoryCloneUrl ?? ""} />
      </div>
    </Card>
  );
}

function BuildConfigCard({
  environmentName,
  module,
  onOpenBuildAdapter,
}: {
  environmentName: string | undefined;
  module: ModuleRecord;
  onOpenBuildAdapter: (adapterId: string) => void;
}) {
  const config = module.buildConfig;
  const branches = config.autoBuildBranches ?? [];
  const buildMode = config.buildMode ?? "dockerfile";
  const adapterId = buildMode === "adapter" ? (config.buildAdapterId ?? "") : "";
  const params = Object.entries(config.buildAdapterParams ?? {});
  // 只用来取参数显示名称和停用状态；没有读取权限时回退到 key 和模块里的适配器名称。
  const { data: adapter } = useQuery({
    enabled: adapterId !== "",
    queryFn: () => fetchBuildAdapter(adapterId),
    queryKey: buildAdapterDetailQueryKey(adapterId),
    retry: false,
  });
  const parameterLabels = new Map(
    adapter?.parameters.map((parameter) => [parameter.key, parameter.label || parameter.key]),
  );

  return (
    <Card className="gap-0 rounded-lg py-0">
      <SectionHeader title="构建配置" description="构建方式、自动构建与预览通道" />
      <div className="grid gap-3 p-4 md:grid-cols-2">
        <DetailItem icon={Hammer} label="构建方式" value={buildModeLabels[buildMode]} />
        {adapterId ? (
          <DetailItem
            icon={Blocks}
            label="构建适配器"
            value={
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <Button
                  variant="link"
                  type="button"
                  className="h-auto p-0 font-semibold text-sm"
                  onClick={() => onOpenBuildAdapter(adapterId)}
                >
                  {config.buildAdapterName || adapter?.name || adapterId}
                </Button>
                {adapter ? (
                  <span className="font-mono font-normal text-muted-foreground text-xs">
                    v{adapter.version}
                  </span>
                ) : null}
                {adapter?.status === "disabled" ? (
                  <Badge variant="neutral" size="sm">
                    已停用
                  </Badge>
                ) : null}
              </span>
            }
          />
        ) : (
          <DetailItem
            icon={FileCode2}
            label="Dockerfile 路径"
            value={<span className="font-mono">{config.dockerfilePath || "-"}</span>}
          />
        )}
        {adapterId ? (
          <DetailItem
            icon={SlidersHorizontal}
            label="适配器参数"
            wide
            value={
              params.length > 0 ? (
                <span className="grid gap-1">
                  {params.map(([key, value]) => (
                    <span key={key} className="flex min-w-0 flex-wrap items-baseline gap-2">
                      <span className="font-normal text-muted-foreground text-xs">
                        {parameterLabels.get(key) ?? key}
                      </span>
                      <span className="break-all font-mono text-xs">{value}</span>
                    </span>
                  ))}
                </span>
              ) : (
                <span className="font-normal text-muted-foreground">未填写，使用默认值</span>
              )
            }
          />
        ) : null}
        <DetailItem
          icon={FolderTree}
          label="构建上下文"
          value={<span className="font-mono">{config.buildContext || "-"}</span>}
        />
        <DetailItem
          icon={GitBranch}
          label="自动构建分支"
          wide
          value={
            branches.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {branches.map((branch) => (
                  <Badge key={branch} variant="outline" className="font-mono">
                    {branch}
                  </Badge>
                ))}
              </span>
            ) : (
              <span className="font-normal text-muted-foreground">未开启自动构建</span>
            )
          }
        />
        <DetailItem
          icon={Hammer}
          label="自动构建环境"
          value={
            config.autoBuildEnvironment ? (environmentName ?? config.autoBuildEnvironment) : "-"
          }
        />
        <DetailItem
          icon={Rocket}
          label="预览通道"
          value={
            config.autoPreviewRelease ? (
              <span className="inline-flex items-center gap-1.5">
                已开启
                <span className="inline-flex items-center gap-1 font-normal text-muted-foreground text-xs">
                  <Clock className="size-3" />
                  {config.autoPreviewTtlHours} 小时后过期
                </span>
              </span>
            ) : (
              <span className="font-normal text-muted-foreground">未开启</span>
            )
          }
        />
      </div>
    </Card>
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

function OwnerInfoPill({ module }: { module: ModuleRecord }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
      <OwnerAvatar avatarUrl={module.ownerAvatarUrl ?? ""} name={module.owner} />
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">负责人</div>
        <div className="truncate font-semibold text-foreground text-sm">{module.owner || "-"}</div>
        {module.ownerEmail ? (
          <div className="truncate text-muted-foreground text-xs">{module.ownerEmail}</div>
        ) : null}
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
      {name.slice(0, 1).toUpperCase() || <UserRound className="size-4" />}
    </span>
  );
}

function SectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex h-12 items-center justify-between border-border border-b px-4">
      <div>
        <div className="font-semibold text-foreground text-sm">{title}</div>
        <div className="text-muted-foreground text-xs">{description}</div>
      </div>
    </div>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
  wide = false,
}: {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 gap-3 rounded-md border border-border bg-card px-3 py-3",
        wide && "md:col-span-2",
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-muted-foreground text-xs">{label}</div>
        <div className="mt-1 break-all font-semibold text-foreground text-sm">{value || "-"}</div>
      </div>
    </div>
  );
}

function ModuleDetailFallback({ isFetching, onBack }: { isFetching: boolean; onBack: () => void }) {
  return (
    <div className="space-y-4 px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 h-8 gap-2 px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回模块管理
      </Button>

      <Card className="rounded-lg p-6">
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
              <div className="font-semibold text-foreground">未找到模块详情</div>
              <div className="mt-1 text-muted-foreground text-sm">当前接口没有返回对应的模块。</div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
