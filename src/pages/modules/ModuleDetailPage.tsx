import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Hammer, PenLine } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { buildAdapterDetailQueryKey, fetchBuildAdapter } from "@/api/build-adapters";
import { buildsSnapshotQueryKey, createBuild } from "@/api/builds";
import { DetailList, ErrorMessage, PageHeader } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { buildModeLabels, codeSourceProviderLabels, kindClass, kindLabels } from "./constants";
import type { ModuleRecord } from "./types";
import { formatCommonModule } from "./utils";

type ModuleDetailPageProps = {
  moduleId: string;
  onBack: () => void;
  onEditModule: (moduleId: string) => void;
  onOpenBuild: (buildId: string) => void;
  onOpenBuildAdapter: (adapterId: string) => void;
};

export function ModuleDetailPage({
  moduleId,
  onBack,
  onEditModule,
  onOpenBuild,
  onOpenBuildAdapter,
}: ModuleDetailPageProps) {
  const queryClient = useQueryClient();
  const {
    data: snapshot,
    error,
    isFetching,
    refetch,
  } = useQuery({
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
  const session = useAuthStore((state) => state.session);
  const canManageModules = Boolean(session?.capabilities.canManageModules);
  const canCreateBuild = Boolean(session?.capabilities.canCreateBuild);
  const [isBuildDialogOpen, setIsBuildDialogOpen] = useState(false);
  const [buildError, setBuildError] = useState("");
  const [submittedBuild, setSubmittedBuild] = useState<{ id: string; number: number } | null>(null);
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
    return (
      <div className="flex flex-col gap-5">
        <PageHeader backLabel="模块" onBack={onBack} title={isFetching ? "加载中" : "模块"} />
        {error ? (
          <ErrorMessage error={error} onRetry={() => void refetch()} />
        ) : isFetching ? (
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        ) : (
          <p className="m-0 rounded-xl bg-card px-5 py-4 text-muted-foreground text-sm shadow-edge">
            没有找到这个模块，它可能已被删除，或者你没有查看权限。
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backLabel="模块"
        onBack={onBack}
        title={
          <span className="flex flex-wrap items-center gap-2.5">
            {module.name}
            <span
              className={cn(
                "inline-flex h-6 items-center rounded-md px-2 font-medium text-xs",
                kindClass[module.kind],
              )}
            >
              {kindLabels[module.kind]}
            </span>
          </span>
        }
        description={
          <>
            {module.applicationName || "未关联应用"} · 负责人 {module.owner || "-"} · 默认分支{" "}
            {module.defaultBranch || "-"} · <span className="font-mono text-xs">{module.id}</span>
          </>
        }
        actions={
          <>
            <Button variant="outline" type="button" onClick={() => onEditModule(module.id)}>
              <PenLine />
              编辑配置
            </Button>
            <Button
              type="button"
              disabled={!canCreateBuild}
              onClick={() => {
                setBuildError("");
                setIsBuildDialogOpen(true);
              }}
            >
              <Hammer />
              新建构建
            </Button>
          </>
        }
      />

      {submittedBuild ? (
        <Alert variant="success">
          <span className="flex flex-wrap items-center gap-x-3">
            构建 #{submittedBuild.number} 已提交
            <Button
              className="h-auto p-0 text-success"
              onClick={() => onOpenBuild(submittedBuild.id)}
              type="button"
              variant="link"
            >
              查看构建
            </Button>
          </span>
        </Alert>
      ) : null}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="releases">
            已发布构建{releaseRecords.length ? ` · ${releaseRecords.length}` : ""}
          </TabsTrigger>
          <TabsTrigger value="variables">构建变量</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5">
          <div className="grid gap-4 xl:grid-cols-2">
            <Section title="仓库">
              <RepositoryDetails module={module} />
            </Section>
            <Section title="构建配置">
              <BuildConfigDetails
                environmentName={
                  environmentOptions.find(
                    (option) => option.value === module.buildConfig.autoBuildEnvironment,
                  )?.label
                }
                module={module}
                onOpenBuildAdapter={onOpenBuildAdapter}
              />
            </Section>
            <ModuleWebhookPanel module={module} />
            <Section title="模块关系">
              <DetailList
                items={[
                  { hint: module.applicationId, label: "关联应用", value: module.applicationName },
                  { label: "通用模块", value: formatCommonModule(module) },
                ]}
              />
            </Section>
          </div>
        </TabsContent>

        <TabsContent value="releases" className="mt-5">
          <PublishedBuildsPanel isFetching={isReleaseRecordsFetching} records={releaseRecords} />
        </TabsContent>

        <TabsContent value="variables" className="mt-5">
          <ModuleBuildVariablesPanel
            canManage={canManageModules}
            environmentOptions={environmentOptions}
            moduleId={module.id}
          />
        </TabsContent>
      </Tabs>

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
          setSubmittedBuild(null);

          try {
            const build = await createBuild({
              branch: form.branch.trim(),
              environment: form.environment,
              moduleId: module.id,
            });
            setSubmittedBuild({ id: build.id, number: build.number });
            setIsBuildDialogOpen(false);
            await queryClient.invalidateQueries({ queryKey: buildsSnapshotQueryKey() });
          } catch (createError) {
            setBuildError(
              createError instanceof Error ? createError.message : "提交构建失败，请稍后重试",
            );
          }
        }}
      />
    </div>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-xl bg-card p-5 shadow-edge">
      <h2 className="m-0 mb-4 font-medium text-muted-foreground text-xs">{title}</h2>
      {children}
    </section>
  );
}

function RepositoryDetails({ module }: { module: ModuleRecord }) {
  return (
    <DetailList
      items={[
        {
          label: "仓库",
          value: module.repositoryWebUrl ? (
            <a
              href={module.repositoryWebUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary-text hover:underline"
            >
              {module.repositoryFullName}
              <ExternalLink className="size-3.5" />
            </a>
          ) : (
            module.repositoryFullName
          ),
          wide: true,
        },
        {
          hint: codeSourceProviderLabels[module.repositoryProvider],
          label: "代码源连接",
          value: (
            <span className="inline-flex items-center gap-1.5">
              <CodeSourceProviderIcon provider={module.repositoryProvider} />
              {module.codeSourceConnectionName || module.codeSourceConnectionId}
            </span>
          ),
        },
        { label: "默认分支", mono: true, value: module.defaultBranch ?? "" },
        { label: "仓库 ID", mono: true, value: module.repositoryId },
        { label: "Clone URL", mono: true, value: module.repositoryCloneUrl ?? "", wide: true },
      ]}
    />
  );
}

function BuildConfigDetails({
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
    <DetailList
      items={[
        { label: "构建方式", value: buildModeLabels[buildMode] },
        adapterId
          ? {
              hint: [
                adapter ? `v${adapter.version}` : "",
                adapter?.status === "disabled" ? "已停用" : "",
              ]
                .filter(Boolean)
                .join(" · "),
              label: "构建适配器",
              value: (
                <Button
                  variant="link"
                  type="button"
                  className="h-auto p-0 font-normal text-sm"
                  onClick={() => onOpenBuildAdapter(adapterId)}
                >
                  {config.buildAdapterName || adapter?.name || adapterId}
                </Button>
              ),
            }
          : buildMode === "gitlab_ci"
            ? { label: "CI job", mono: true, value: config.ciJob || "-" }
            : { label: "Dockerfile 路径", mono: true, value: config.dockerfilePath || "-" },
        buildMode === "gitlab_ci"
          ? { label: "产物目录", mono: true, value: config.ciArtifactPath || "-" }
          : null,
        adapterId
          ? {
              label: "适配器参数",
              value:
                params.length > 0 ? (
                  <span className="grid gap-1">
                    {params.map(([key, value]) => (
                      <span key={key} className="flex min-w-0 flex-wrap items-baseline gap-2">
                        <span className="text-faint text-xs">
                          {parameterLabels.get(key) ?? key}
                        </span>
                        <span className="break-all font-mono text-xs">{value}</span>
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-muted-foreground">未填写，使用默认值</span>
                ),
              wide: true,
            }
          : null,
        { label: "构建上下文", mono: true, value: config.buildContext || "-" },
        {
          label: "自动构建环境",
          value: config.autoBuildEnvironment
            ? (environmentName ?? config.autoBuildEnvironment)
            : "-",
        },
        {
          label: "自动构建分支",
          value:
            branches.length > 0 ? (
              <span className="flex flex-wrap gap-1.5">
                {branches.map((branch) => (
                  <Badge key={branch} variant="neutral" className="font-mono">
                    {branch}
                  </Badge>
                ))}
              </span>
            ) : (
              <span className="text-muted-foreground">未开启自动构建</span>
            ),
          wide: true,
        },
      ]}
    />
  );
}
