import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Rocket, X } from "lucide-react";
import { useState } from "react";

import { buildAdapterDetailQueryKey, fetchBuildAdapter } from "@/api/build-adapters";
import { fetchModuleDetailSnapshot, moduleDetailQueryKey } from "@/api/modules";
import { DetailList, ErrorMessage } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { buildDetailQueryKey, fetchBuildDetail } from "../api/builds-snapshot";
import {
  buildDetailRefetchIntervalMs,
  buildPlatformLabels,
  buildTriggerLabels,
  repositoryProviderLabels,
} from "../constants";
import type { BuildPlatform, BuildRecordDetail, BuildRunRecord } from "../types";
import {
  getArtifactBaseURL,
  getStorageConfigurationDisplayName,
  isLiveBuildStatus,
} from "../utils";
import { ArtifactTreePanel } from "./ArtifactTreePanel";
import { BuildLogPanel } from "./BuildLogPanel";
import { BuildCommitLink, BuildCreator, BuildPlatformBadges } from "./BuildMeta";
import { BuildStatusBadge } from "./BuildStatusBadge";

type BuildDetailPanelProps = {
  buildId: string;
  canCreateRelease: boolean;
  onClose: () => void;
  onOpenBuild: (buildId: string) => void;
  onOpenBuildAdapter: (adapterId: string) => void;
  onOpenEnvironment: (environmentId: string) => void;
  onOpenStorage: (storageId: string) => void;
  onRelease: (build: BuildRunRecord) => void;
};

type BuildTab = "overview" | "logs" | "artifacts";

export function BuildDetailPanel(props: BuildDetailPanelProps) {
  const { buildId, onClose } = props;
  const {
    data: build,
    error,
    refetch,
  } = useQuery({
    queryFn: () => fetchBuildDetail(buildId),
    queryKey: buildDetailQueryKey(buildId),
    refetchInterval: (query) => {
      const current = query.state.data as BuildRecordDetail | undefined;
      return isLiveBuildStatus(current?.status) ? buildDetailRefetchIntervalMs : false;
    },
  });

  if (!build) {
    return (
      <div className="flex flex-col gap-4 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
          <CloseButton onClose={onClose} />
        </div>
        {error ? (
          <ErrorMessage error={error} onRetry={() => void refetch()} />
        ) : (
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
        )}
      </div>
    );
  }

  return <BuildDetailContent key={build.id} {...props} build={build} />;
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <Button aria-label="关闭详情" onClick={onClose} size="icon" type="button" variant="ghost">
      <X />
    </Button>
  );
}

function BuildDetailContent({
  build,
  canCreateRelease,
  onClose,
  onOpenBuild,
  onOpenBuildAdapter,
  onOpenEnvironment,
  onOpenStorage,
  onRelease,
}: BuildDetailPanelProps & { build: BuildRecordDetail }) {
  const isLive = isLiveBuildStatus(build.status);
  const [tab, setTab] = useState<BuildTab>(
    isLive || build.status === "failed" ? "logs" : "overview",
  );
  const { data: moduleSnapshot } = useQuery({
    enabled: Boolean(build.moduleId && build.moduleId !== "-"),
    queryFn: () => fetchModuleDetailSnapshot(build.moduleId),
    queryKey: moduleDetailQueryKey(build.moduleId),
  });
  const buildAdapterId = build.buildAdapterId;
  // 读取适配器需要平台管理员或应用 Owner 权限；读不到时回退到模块里的适配器名称或 id。
  const { data: buildAdapter } = useQuery({
    enabled: buildAdapterId !== "",
    queryFn: () => fetchBuildAdapter(buildAdapterId),
    queryKey: buildAdapterDetailQueryKey(buildAdapterId),
    retry: false,
  });
  const buildModule = moduleSnapshot?.modules[0];
  const buildAdapterName =
    buildAdapter?.name ||
    (buildModule?.buildConfig.buildAdapterId === buildAdapterId
      ? buildModule?.buildConfig.buildAdapterName
      : "") ||
    buildAdapterId;
  const platforms =
    build.platforms.length > 0
      ? build.platforms
          .map((platform) => buildPlatformLabels[platform as BuildPlatform] ?? platform)
          .join(" / ")
      : "构建成功后从 forge.json 读取";

  const link = (label: string, onClick?: () => void) =>
    onClick ? (
      <Button
        className="h-auto p-0 font-normal text-sm"
        onClick={onClick}
        type="button"
        variant="link"
      >
        {label}
      </Button>
    ) : (
      label
    );

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-3 px-6 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 font-semibold text-foreground text-xl tracking-tight">
                构建 #{build.number || build.id.slice(-8)}
              </h2>
              <BuildStatusBadge status={build.status} />
            </div>
            <p className="m-0 mt-1.5 truncate text-muted-foreground text-sm">
              {build.module} · {build.environmentName} · {build.branch} · {build.createdAt}
            </p>
          </div>
          <CloseButton onClose={onClose} />
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateRelease && build.status === "success" ? (
            <Button size="sm" type="button" onClick={() => onRelease(build)}>
              <Rocket />
              发布
            </Button>
          ) : null}
          {build.artifactUrl !== "-" ? (
            <Button asChild size="sm" type="button" variant="outline">
              <a href={build.artifactUrl} rel="noreferrer" target="_blank">
                <ExternalLink />
                打开产物
              </a>
            </Button>
          ) : null}
        </div>
      </header>

      <Tabs value={tab} onValueChange={(value) => setTab(value as BuildTab)} className="px-6 pb-6">
        <TabsList className="w-full">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="logs">{isLive ? "日志 · 实时" : "日志"}</TabsTrigger>
          <TabsTrigger value="artifacts">产物</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-5 flex flex-col gap-6">
          {build.errorMessage ? (
            <Alert variant="danger">
              <div>
                <div className="font-medium">构建失败原因</div>
                <div className="mt-1 whitespace-pre-wrap leading-6">{build.errorMessage}</div>
              </div>
            </Alert>
          ) : null}

          <section className="rounded-xl bg-card p-5 shadow-edge">
            <h3 className="m-0 mb-4 font-medium text-muted-foreground text-xs">构建</h3>
            <DetailList
              items={[
                { hint: platforms, label: "运行时版本", value: build.runtimeVersion || "-" },
                build.providedCapabilities
                  ? { label: "提供能力", value: build.providedCapabilities }
                  : null,
                build.requiredCapabilities
                  ? {
                      hint: "要求所属 Common 构建达到的等级",
                      label: "依赖能力",
                      value: build.requiredCapabilities,
                    }
                  : null,
                { label: "耗时", value: build.duration, hint: `开始 ${build.startedAt}` },
                { label: "完成时间", value: build.finishedAt },
                {
                  hint:
                    build.triggerType === "webhook" && build.triggerId !== "-"
                      ? build.triggerId
                      : undefined,
                  label: "触发方式",
                  value: buildTriggerLabels[build.triggerType],
                },
                {
                  hint:
                    build.triggerType === "webhook" && build.createdBy
                      ? "Webhook 构建记录为代码源连接的创建人"
                      : undefined,
                  label: "创建人",
                  value: <BuildCreator createdBy={build.createdBy} />,
                },
                { label: "Commit", value: <BuildCommitLink build={build} /> },
                { label: "平台", value: <BuildPlatformBadges platforms={build.platforms} /> },
                {
                  hint: build.status === "queued" ? "等待分配" : undefined,
                  label: "执行节点",
                  mono: true,
                  value: build.workerId,
                },
                build.ciPipelineUrl
                  ? {
                      label: "GitLab pipeline",
                      value: (
                        <a
                          className="text-primary text-sm hover:underline"
                          href={build.ciPipelineUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          打开 pipeline
                        </a>
                      ),
                    }
                  : null,
                buildAdapterId
                  ? {
                      hint:
                        build.buildAdapterVersion !== null
                          ? `版本 v${build.buildAdapterVersion}`
                          : "版本待渲染后写入",
                      label: "构建适配器",
                      value: link(buildAdapterName, () => onOpenBuildAdapter(buildAdapterId)),
                    }
                  : null,
                buildAdapterId
                  ? {
                      hint: build.renderedDockerfileSha256
                        ? "渲染后 Dockerfile 的摘要"
                        : "尚未渲染",
                      label: "渲染结果 sha256",
                      mono: true,
                      value: build.renderedDockerfileSha256
                        ? build.renderedDockerfileSha256.slice(0, 12)
                        : "-",
                    }
                  : null,
                {
                  hint:
                    build.dependencyBuilds.length > 0
                      ? "构建时注入到 .forge/deps/ 的产物"
                      : undefined,
                  label: "依赖构建",
                  value:
                    build.dependencyBuilds.length > 0 ? (
                      <ul className="m-0 flex list-none flex-col gap-1 p-0">
                        {build.dependencyBuilds.map((dependency) => (
                          <li
                            className="flex flex-wrap items-center gap-x-2"
                            key={dependency.buildRecordId}
                          >
                            <span>{dependency.moduleName || dependency.moduleId}</span>
                            <span className="font-mono text-muted-foreground text-xs">
                              {dependency.runtimeVersion}
                            </span>
                            {link(
                              `#${dependency.buildNumber || dependency.buildRecordId.slice(-8)}`,
                              () => onOpenBuild(dependency.buildRecordId),
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    ),
                  wide: true,
                },
                { label: "产物 URL", mono: true, value: getArtifactBaseURL(build), wide: true },
              ]}
            />
          </section>

          <section className="rounded-xl bg-card p-5 shadow-edge">
            <h3 className="m-0 mb-4 font-medium text-muted-foreground text-xs">上下文</h3>
            <DetailList
              items={[
                {
                  hint: `${repositoryProviderLabels[build.repositoryProvider]} · 连接 ${build.codeSourceConnectionId}`,
                  label: "仓库",
                  value: build.repositoryWebUrl ? (
                    <a
                      className="inline-flex items-center gap-1 text-primary-text hover:underline"
                      href={build.repositoryWebUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      {build.repositoryFullName}
                      <ExternalLink className="size-3.5" />
                    </a>
                  ) : (
                    build.repositoryFullName
                  ),
                  wide: true,
                },
                {
                  label: "环境",
                  value: link(
                    build.environmentName,
                    build.environment && build.environment !== "-"
                      ? () => onOpenEnvironment(build.environment)
                      : undefined,
                  ),
                },
                {
                  label: "存储配置",
                  value: link(
                    getStorageConfigurationDisplayName(build),
                    build.storageConfigurationId && build.storageConfigurationId !== "-"
                      ? () => onOpenStorage(build.storageConfigurationId)
                      : undefined,
                  ),
                },
              ]}
            />
          </section>
        </TabsContent>

        <TabsContent value="logs" className="mt-5">
          <BuildLogPanel buildId={build.id} isLive={isLive} />
        </TabsContent>

        <TabsContent value="artifacts" className="mt-5">
          <ArtifactTreePanel applicationSlug={buildModule?.applicationSlug ?? ""} build={build} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
