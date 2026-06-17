import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  CalendarClock,
  Clock3,
  Database,
  ExternalLink,
  GitBranch,
  HardDrive,
  PackageCheck,
  RadioTower,
  Server,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { buildDetailQueryKey, fetchBuildDetail } from "./api/builds-snapshot";
import { buildStatusClass, buildStatusLabels, buildTriggerLabels } from "./constants";
import type { BuildRunStatus } from "./types";

type BuildDetailPageProps = {
  buildId: string;
  onBack: () => void;
};

export function BuildDetailPage({ buildId, onBack }: BuildDetailPageProps) {
  const {
    data: build,
    error,
    isFetching,
  } = useQuery({
    queryFn: () => fetchBuildDetail(buildId),
    queryKey: buildDetailQueryKey(buildId),
  });

  if (!build) {
    return <BuildDetailFallback error={error} isFetching={isFetching} onBack={onBack} />;
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
              返回构建记录
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm">
                <PackageCheck className="size-5" />
              </div>
              <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">{build.id}</h1>
              <BuildStatusBadge status={build.status} />
              <Badge variant="outline" className="border-slate-200 font-mono text-slate-600">
                {buildTriggerLabels[build.triggerType]}
              </Badge>
            </div>
            <p className="mt-2 text-slate-600 text-sm">
              {build.application} / {build.module} / {build.environmentName}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {build.artifactUrl !== "-" ? (
              <Button asChild type="button" className="bg-blue-600 text-white hover:bg-blue-700">
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
            description={`默认 ${build.defaultBranch}`}
          />
          <SummaryCard
            icon={Clock3}
            label="耗时"
            value={build.duration}
            description={`开始 ${build.startedAt}`}
          />
          <SummaryCard
            icon={Server}
            label="执行节点"
            value={build.workerId}
            description={build.status === "queued" ? "等待分配" : "Worker"}
          />
        </section>

        {build.errorMessage ? (
          <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <div className="font-semibold text-sm">构建失败原因</div>
                <div className="mt-1 whitespace-pre-wrap text-sm leading-6">
                  {build.errorMessage}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <SectionHeader title="构建信息" description="执行状态、触发来源和产物路径" />
            <div className="grid gap-3 p-4 md:grid-cols-2">
              <DetailItem icon={CalendarClock} label="排队时间" value={build.queuedAt} />
              <DetailItem
                icon={CalendarClock}
                label="开始时间"
                value={build.startedAtRaw ? build.startedAtFull : "-"}
              />
              <DetailItem icon={CalendarClock} label="完成时间" value={build.finishedAt} />
              <DetailItem icon={CalendarClock} label="更新时间" value={build.updatedAt} />
              <DetailItem
                icon={RadioTower}
                label="触发方式"
                value={buildTriggerLabels[build.triggerType]}
              />
              <DetailItem icon={RadioTower} label="触发来源" value={build.triggerId} />
              <DetailItem icon={HardDrive} label="产物 Key" value={build.artifact} wide />
              <DetailItem icon={HardDrive} label="产物 URL" value={build.artifactUrl} wide />
            </div>
          </Card>

          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <SectionHeader title="上下文" description="仓库、环境和存储配置" />
            <div className="grid gap-3 p-4">
              <DetailItem icon={GitBranch} label="仓库" value={build.repositoryFullName} />
              <DetailItem icon={GitBranch} label="Repository ID" value={build.repositoryId} />
              <DetailItem
                icon={GitBranch}
                label="Installation ID"
                value={build.repositoryInstallationId}
              />
              <DetailItem icon={Database} label="环境 Code" value={build.environment} />
              <DetailItem icon={Database} label="环境名称" value={build.environmentName} />
              <DetailItem
                icon={Database}
                label="存储配置"
                value={build.storageConfigurationName}
                description={build.storageConfigurationId}
              />
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}

function BuildDetailFallback({
  error,
  isFetching,
  onBack,
}: {
  error: Error | null;
  isFetching: boolean;
  onBack: () => void;
}) {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <Button
          variant="ghost"
          type="button"
          className="-ml-2 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          返回构建记录
        </Button>
      </div>
      <div className="px-6 py-5">
        <Card className="rounded-lg border-slate-200 p-8 text-center shadow-sm">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <PackageCheck className="size-5" />
          </div>
          <div className="mt-3 font-semibold text-slate-950">
            {isFetching ? "正在加载构建详情" : "未找到构建记录"}
          </div>
          <div className="mt-2 text-slate-500 text-sm">
            {error instanceof Error ? error.message : "构建记录可能已被删除或当前账号无权限访问。"}
          </div>
        </Card>
      </div>
    </>
  );
}

function SummaryCard({
  description,
  icon: Icon,
  label,
  value,
}: {
  description: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-lg px-5 py-4 shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-medium text-slate-500 text-sm">{label}</div>
          <div className="mt-2 truncate font-semibold text-slate-950 text-xl">{value}</div>
          <div className="mt-1 truncate text-slate-500 text-xs">{description}</div>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
          <Icon className="size-4" />
        </div>
      </div>
    </Card>
  );
}

function SectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex h-12 items-center justify-between border-slate-200 border-b px-4">
      <div>
        <div className="font-semibold text-slate-900 text-sm">{title}</div>
        <div className="text-slate-500 text-xs">{description}</div>
      </div>
    </div>
  );
}

function DetailItem({
  description,
  icon: Icon,
  label,
  value,
  wide = false,
}: {
  description?: string;
  icon: LucideIcon;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2",
        wide && "md:col-span-2",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <div className="text-slate-500 text-xs">{label}</div>
        <div className="break-all font-semibold text-slate-800 text-sm">{value || "-"}</div>
        {description ? (
          <div className="mt-0.5 break-all text-slate-500 text-xs">{description}</div>
        ) : null}
      </div>
    </div>
  );
}

function BuildStatusBadge({ status }: { status: BuildRunStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        buildStatusClass[status],
      )}
    >
      {buildStatusLabels[status]}
    </span>
  );
}
