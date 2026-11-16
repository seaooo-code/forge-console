import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Box,
  CalendarClock,
  Clock3,
  Database,
  ExternalLink,
  GitBranch,
  GitCommitHorizontal,
  HardDrive,
  Layers,
  PackageCheck,
  RadioTower,
  Server,
  UserRound,
} from "lucide-react";

import { fetchModuleDetailSnapshot, moduleDetailQueryKey } from "@/api/modules";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { buildDetailQueryKey, fetchBuildDetail } from "./api/builds-snapshot";
import { ArtifactTreePanel } from "./components/ArtifactTreePanel";
import {
  BuildDetailFallback,
  BuildStatusBadge,
  DetailItem,
  SectionHeader,
  SummaryCard,
} from "./components/BuildDetailSummary";
import { BuildLogPanel } from "./components/BuildLogPanel";
import { BuildCommitLink, BuildCreator, BuildPlatformBadges } from "./components/BuildMeta";
import {
  buildDetailRefetchIntervalMs,
  buildPlatformLabels,
  buildTriggerLabels,
  repositoryProviderLabels,
} from "./constants";
import type { BuildPlatform, BuildRecordDetail } from "./types";
import { getArtifactBaseURL, getStorageConfigurationDisplayName, isLiveBuildStatus } from "./utils";

type BuildDetailPageProps = {
  buildId: string;
  onBack: () => void;
  onOpenEnvironment: (environmentId: string) => void;
  onOpenStorage: (storageId: string) => void;
};

export function BuildDetailPage({
  buildId,
  onBack,
  onOpenEnvironment,
  onOpenStorage,
}: BuildDetailPageProps) {
  const {
    data: build,
    error,
    isFetching,
  } = useQuery({
    queryFn: () => fetchBuildDetail(buildId),
    queryKey: buildDetailQueryKey(buildId),
    refetchInterval: (query) => {
      const currentBuild = query.state.data as BuildRecordDetail | undefined;
      return isLiveBuildStatus(currentBuild?.status) ? buildDetailRefetchIntervalMs : false;
    },
  });
  const buildModuleId = build?.moduleId;
  const { data: moduleSnapshot } = useQuery({
    enabled: Boolean(buildModuleId && buildModuleId !== "-"),
    queryFn: () => fetchModuleDetailSnapshot(buildModuleId ?? ""),
    queryKey: moduleDetailQueryKey(buildModuleId),
  });

  if (!build) {
    return <BuildDetailFallback error={error} isFetching={isFetching} onBack={onBack} />;
  }

  const applicationSlug = moduleSnapshot?.modules[0]?.applicationSlug ?? "";

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
              返回构建管理
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <PackageCheck className="size-5" />
              </div>
              <h1 className="font-semibold text-2xl text-foreground tracking-tight">
                构建 {build.createdAt}
              </h1>
              <BuildStatusBadge status={build.status} />
              <Badge variant="outline" className="border-border font-mono text-muted-foreground">
                {buildTriggerLabels[build.triggerType]}
              </Badge>
              {isLiveBuildStatus(build.status) ? (
                <Badge variant="outline" className="border-info/30 bg-info/10 text-info">
                  自动刷新中
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-muted-foreground text-sm">
              {build.application} / {build.module} / {build.environmentName}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {build.artifactUrl !== "-" ? (
              <Button
                asChild
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <a href={build.artifactUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  打开产物
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard icon={Box} label="模块" value={build.module} description={build.moduleId} />
          <SummaryCard
            icon={GitBranch}
            label="分支"
            value={build.branch}
            description={
              build.commitShortSha
                ? `commit ${build.commitShortSha}`
                : `默认 ${build.defaultBranch}`
            }
          />
          <SummaryCard
            icon={Layers}
            label="运行时版本"
            value={build.runtimeVersion || "-"}
            description={
              build.platforms.length > 0
                ? build.platforms
                    .map((platform) => buildPlatformLabels[platform as BuildPlatform] ?? platform)
                    .join(" / ")
                : "构建成功后从 forge.json 读取"
            }
          />
          <SummaryCard
            icon={Clock3}
            label="耗时"
            value={build.duration}
            description={`开始 ${build.startedAt}`}
          />
        </section>

        {build.errorMessage ? (
          <Alert variant="danger">
            <div className="font-semibold text-sm">构建失败原因</div>
            <div className="mt-1 whitespace-pre-wrap text-sm leading-6">{build.errorMessage}</div>
          </Alert>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="gap-0 rounded-lg border-border py-0 shadow-sm">
            <SectionHeader title="构建信息" description="执行状态、触发来源和产物地址" />
            <div className="grid gap-3 p-4 md:grid-cols-2">
              <DetailItem
                icon={CalendarClock}
                label="开始时间"
                value={build.startedAtRaw ? build.startedAtFull : "-"}
              />
              <DetailItem icon={CalendarClock} label="完成时间" value={build.finishedAt} />
              <DetailItem
                icon={RadioTower}
                label="触发方式"
                value={buildTriggerLabels[build.triggerType]}
              />
              <DetailItem
                icon={RadioTower}
                label={build.triggerType === "webhook" ? "Webhook Delivery ID" : "触发来源"}
                value={build.triggerId}
              />
              <DetailItem
                icon={UserRound}
                label="创建人"
                value=""
                description={
                  build.triggerType === "webhook" && build.createdBy
                    ? "Webhook 构建记录为代码源连接的创建人"
                    : undefined
                }
              >
                <BuildCreator createdBy={build.createdBy} />
              </DetailItem>
              <DetailItem icon={GitCommitHorizontal} label="Commit" value="">
                <BuildCommitLink build={build} />
              </DetailItem>
              <DetailItem icon={Layers} label="平台" value="">
                <BuildPlatformBadges platforms={build.platforms} />
              </DetailItem>
              <DetailItem
                icon={Server}
                label="执行节点"
                value={build.workerId}
                description={build.status === "queued" ? "等待分配" : undefined}
              />
              <DetailItem
                icon={HardDrive}
                label="产物 URL"
                value={getArtifactBaseURL(build)}
                wide
              />
            </div>
          </Card>

          <Card className="gap-0 rounded-lg border-border py-0 shadow-sm">
            <SectionHeader title="上下文" description="仓库、环境和存储配置" />
            <div className="grid gap-3 p-4">
              <DetailItem
                icon={GitBranch}
                label="仓库"
                value={build.repositoryFullName}
                description={`${repositoryProviderLabels[build.repositoryProvider]} · 连接 ${build.codeSourceConnectionId}`}
                href={build.repositoryWebUrl || undefined}
              />
              <DetailItem
                icon={Database}
                label="环境名称"
                value={build.environmentName}
                onClick={
                  build.environment && build.environment !== "-"
                    ? () => onOpenEnvironment(build.environment)
                    : undefined
                }
              />
              <DetailItem
                icon={Database}
                label="存储配置"
                value={getStorageConfigurationDisplayName(build)}
                onClick={
                  build.storageConfigurationId && build.storageConfigurationId !== "-"
                    ? () => onOpenStorage(build.storageConfigurationId)
                    : undefined
                }
              />
            </div>
          </Card>
        </section>

        <BuildLogPanel buildId={build.id} isLive={isLiveBuildStatus(build.status)} />

        <ArtifactTreePanel applicationSlug={applicationSlug} build={build} />
      </div>
    </>
  );
}
