import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeft,
  Box,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock3,
  Database,
  ExternalLink,
  File,
  Folder,
  GitBranch,
  HardDrive,
  PackageCheck,
  RadioTower,
  Server,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { buildDetailQueryKey, fetchBuildDetail } from "./api/builds-snapshot";
import { buildStatusClass, buildStatusLabels, buildTriggerLabels } from "./constants";
import type { BuildArtifactTreeNode, BuildRecordDetail, BuildRunStatus } from "./types";

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
              返回构建管理
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
              <DetailItem
                icon={HardDrive}
                label="Manifest Key"
                value={build.manifestKey || "-"}
                wide
              />
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

        <ArtifactTreePanel build={build} />
      </div>
    </>
  );
}

function ArtifactTreePanel({ build }: { build: BuildRecordDetail }) {
  const nodes = build.artifactTree.nodes;
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(collectDirectoryPaths(nodes)),
  );

  const toggleExpanded = (path: string) => {
    setExpandedPaths((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  return (
    <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
      <SectionHeader title="产物文件" description="构建产物目录结构与文件摘要" />
      <div className="border-slate-200 border-b px-4 py-3">
        <div className="grid gap-3 text-sm md:grid-cols-3">
          <ArtifactSummaryItem
            label="文件数量"
            value={`${build.artifactTree.fileCount || build.fileCount} 个`}
          />
          <ArtifactSummaryItem
            label="总体积"
            value={formatBytes(build.artifactTree.totalSizeBytes || build.totalSizeBytes)}
          />
          <ArtifactSummaryItem label="Manifest" value={build.manifestKey || "-"} monospace />
        </div>
      </div>
      {nodes.length > 0 ? (
        <div className="p-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50">
            {nodes.map((node) => (
              <ArtifactTreeNodeRow
                key={node.path}
                node={node}
                depth={0}
                expandedPaths={expandedPaths}
                onToggle={toggleExpanded}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-6 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <HardDrive className="size-5" />
          </div>
          <div className="mt-3 font-semibold text-slate-900 text-sm">暂无产物文件结构</div>
          <div className="mt-1 text-slate-500 text-sm">
            历史构建仅记录产物根路径，新构建完成后会自动写入 manifest 并展示文件树。
          </div>
        </div>
      )}
    </Card>
  );
}

function ArtifactSummaryItem({
  label,
  monospace = false,
  value,
}: {
  label: string;
  monospace?: boolean;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-slate-500 text-xs">{label}</div>
      <div
        className={cn(
          "mt-1 break-all font-semibold text-slate-800 text-sm",
          monospace && "font-mono font-medium",
        )}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function ArtifactTreeNodeRow({
  depth,
  expandedPaths,
  node,
  onToggle,
}: {
  depth: number;
  expandedPaths: Set<string>;
  node: BuildArtifactTreeNode;
  onToggle: (path: string) => void;
}) {
  const Icon = node.type === "directory" ? Folder : File;
  const children = node.children ?? [];
  const isDirectory = node.type === "directory";
  const isExpanded = expandedPaths.has(node.path);
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <div>
      <div className="grid min-h-10 grid-cols-1 items-start gap-2 border-slate-200 border-b px-3 py-2 last:border-b-0 md:grid-cols-[minmax(0,1fr)_7rem_10rem] md:gap-3">
        <div className="flex min-w-0 items-start gap-2" style={{ paddingLeft: depth * 18 }}>
          {isDirectory ? (
            <button
              type="button"
              aria-label={isExpanded ? `收起 ${node.name}` : `展开 ${node.name}`}
              aria-expanded={isExpanded}
              className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              onClick={() => onToggle(node.path)}
            >
              <ChevronIcon className="size-3.5" />
            </button>
          ) : (
            <span className="size-4 shrink-0" />
          )}
          <Icon
            className={cn(
              "mt-0.5 size-4 shrink-0",
              isDirectory ? "text-amber-500" : "text-slate-400",
            )}
          />
          <div className="min-w-0">
            <div className="break-all font-semibold text-slate-800 text-sm">{node.name}</div>
            {!isDirectory ? (
              <div className="mt-1 space-y-0.5 font-mono text-[11px] text-slate-500 leading-4">
                {node.objectKey ? <div className="break-all">{node.objectKey}</div> : null}
                {node.sha256 ? <div className="break-all">sha256:{node.sha256}</div> : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="text-right font-mono text-slate-600 text-xs">
          {formatBytes(node.sizeBytes)}
        </div>
        <div className="break-all text-slate-500 text-xs">
          {isDirectory ? "目录" : node.contentType || "文件"}
        </div>
      </div>
      {isExpanded
        ? children.map((child) => (
            <ArtifactTreeNodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
            />
          ))
        : null}
    </div>
  );
}

function collectDirectoryPaths(nodes: BuildArtifactTreeNode[]) {
  const paths: string[] = [];
  for (const node of nodes) {
    if (node.type !== "directory") {
      continue;
    }
    paths.push(node.path);
    paths.push(...collectDirectoryPaths(node.children ?? []));
  }
  return paths;
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
          返回构建管理
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

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
}
