import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Box,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Clock3,
  Copy,
  Database,
  Download,
  ExternalLink,
  File,
  Folder,
  GitBranch,
  HardDrive,
  PackageCheck,
  RadioTower,
  Search,
  Server,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { apiBaseUrl } from "@/api/client";
import { fetchModuleDetailSnapshot, moduleDetailQueryKey } from "@/api/modules";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { buildDetailQueryKey, fetchBuildDetail } from "./api/builds-snapshot";
import { buildStatusClass, buildStatusLabels, buildTriggerLabels } from "./constants";
import type { BuildArtifactTreeNode, BuildRecordDetail, BuildRunStatus } from "./types";

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
      return isLiveBuildStatus(currentBuild?.status) ? 5000 : false;
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
              <DetailItem icon={RadioTower} label="触发来源" value={build.triggerId} />
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
              <DetailItem icon={GitBranch} label="仓库" value={build.repositoryFullName} />
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

        <ArtifactTreePanel applicationSlug={applicationSlug} build={build} />
      </div>
    </>
  );
}

function ArtifactTreePanel({
  applicationSlug,
  build,
}: {
  applicationSlug: string;
  build: BuildRecordDetail;
}) {
  const nodes = build.artifactTree.nodes;
  const directoryPaths = useMemo(() => collectDirectoryPaths(nodes), [nodes]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => new Set());
  const [copiedStatus, setCopiedStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const hasSearch = normalizedSearchQuery.length > 0;
  const visibleNodes = useMemo(
    () => (hasSearch ? filterArtifactTreeNodes(nodes, normalizedSearchQuery) : nodes),
    [hasSearch, nodes, normalizedSearchQuery],
  );
  const visibleFileCount = countArtifactFiles(visibleNodes);

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
  const copyArtifactValue = (value: string, label: string) => {
    if (!value || !navigator.clipboard) {
      setCopiedStatus("复制失败");
      return;
    }

    void navigator.clipboard
      .writeText(value)
      .then(() => setCopiedStatus(`${label}已复制`))
      .catch(() => setCopiedStatus("复制失败"))
      .finally(() => {
        window.setTimeout(() => setCopiedStatus(""), 1800);
      });
  };

  return (
    <Card className="gap-0 rounded-lg border-border py-0 shadow-sm">
      <SectionHeader title="产物文件" description="构建产物目录结构与文件摘要" />
      <div className="border-border border-b px-4 py-3">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <ArtifactSummaryItem
            label="文件数量"
            value={`${build.artifactTree.fileCount || build.fileCount} 个`}
          />
          <ArtifactSummaryItem
            label="总体积"
            value={formatBytes(build.artifactTree.totalSizeBytes || build.totalSizeBytes)}
          />
        </div>
      </div>
      {nodes.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-border border-b px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative min-w-64 flex-1">
              <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                className="h-9 pl-9"
                placeholder="搜索文件名 / 路径 / Object Key"
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            {searchQuery ? (
              <Button
                variant="outline"
                type="button"
                size="icon"
                className="size-9 shrink-0"
                aria-label="清空产物文件搜索"
                onClick={() => setSearchQuery("")}
              >
                <X className="size-4" />
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasSearch ? (
              <span className="text-muted-foreground text-xs">匹配 {visibleFileCount} 个文件</span>
            ) : null}
            {copiedStatus ? <span className="text-success text-xs">{copiedStatus}</span> : null}
            <Button
              variant="outline"
              type="button"
              className="h-9 gap-2 border-border bg-card text-muted-foreground"
              onClick={() => setExpandedPaths(new Set(directoryPaths))}
            >
              <ChevronsDown className="size-4" />
              展开全部
            </Button>
            <Button
              variant="outline"
              type="button"
              className="h-9 gap-2 border-border bg-card text-muted-foreground"
              onClick={() => setExpandedPaths(new Set())}
            >
              <ChevronsUp className="size-4" />
              收起全部
            </Button>
          </div>
        </div>
      ) : null}
      {nodes.length > 0 ? (
        <div className="p-4">
          {visibleNodes.length > 0 ? (
            <div className="rounded-lg border border-border bg-muted">
              {visibleNodes.map((node) => (
                <ArtifactTreeNodeRow
                  key={node.path}
                  applicationSlug={applicationSlug}
                  build={build}
                  node={node}
                  depth={0}
                  expandedPaths={expandedPaths}
                  forceExpanded={hasSearch}
                  onCopy={copyArtifactValue}
                  onToggle={toggleExpanded}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted p-8 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-card text-muted-foreground">
                <Search className="size-5" />
              </div>
              <div className="mt-3 font-semibold text-foreground text-sm">未找到匹配文件</div>
              <div className="mt-1 text-muted-foreground text-sm">
                换一个文件名、路径或 Object Key 再试。
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <HardDrive className="size-5" />
          </div>
          <div className="mt-3 font-semibold text-foreground text-sm">暂无产物文件结构</div>
          <div className="mt-1 text-muted-foreground text-sm">
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
    <div className="min-w-0 rounded-lg border border-border bg-muted px-3 py-2">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div
        className={cn(
          "mt-1 break-all font-semibold text-foreground text-sm",
          monospace && "font-mono font-medium",
        )}
      >
        {value || "-"}
      </div>
    </div>
  );
}

function ArtifactTreeNodeRow({
  applicationSlug,
  build,
  depth,
  expandedPaths,
  forceExpanded,
  node,
  onCopy,
  onToggle,
}: {
  applicationSlug: string;
  build: BuildRecordDetail;
  depth: number;
  expandedPaths: Set<string>;
  forceExpanded: boolean;
  node: BuildArtifactTreeNode;
  onCopy: (value: string, label: string) => void;
  onToggle: (path: string) => void;
}) {
  const Icon = node.type === "directory" ? Folder : File;
  const children = node.children ?? [];
  const isDirectory = node.type === "directory";
  const isExpanded = forceExpanded || expandedPaths.has(node.path);
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;
  const objectKey = isDirectory ? "" : getArtifactObjectKey(build, node);
  const downloadUrl = isDirectory
    ? ""
    : getArtifactFileDownloadURL(build, node, applicationSlug, objectKey);

  return (
    <div>
      <div className="grid min-h-10 grid-cols-1 items-start gap-2 border-border border-b px-3 py-2 last:border-b-0 md:grid-cols-[minmax(0,1fr)_7rem_10rem_7.5rem] md:gap-3">
        <div className="flex min-w-0 items-start gap-2" style={{ paddingLeft: depth * 18 }}>
          {isDirectory ? (
            <button
              type="button"
              aria-label={isExpanded ? `收起 ${node.name}` : `展开 ${node.name}`}
              aria-expanded={isExpanded}
              className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
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
              isDirectory ? "text-warning" : "text-muted-foreground",
            )}
          />
          <div className="min-w-0">
            <div className="break-all font-semibold text-foreground text-sm">{node.name}</div>
            {!isDirectory ? (
              <div className="mt-1 space-y-0.5 font-mono text-[11px] text-muted-foreground leading-4">
                {objectKey ? <div className="break-all">{objectKey}</div> : null}
                {node.sha256 ? <div className="break-all">sha256:{node.sha256}</div> : null}
              </div>
            ) : null}
          </div>
        </div>
        <div className="text-right font-mono text-muted-foreground text-xs">
          {formatBytes(node.sizeBytes)}
        </div>
        <div className="break-all text-muted-foreground text-xs">
          {isDirectory ? "目录" : formatArtifactContentType(node.contentType)}
        </div>
        <div className="flex items-center justify-end gap-1">
          {!isDirectory ? (
            <>
              {downloadUrl ? (
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="size-8 border-border bg-card text-muted-foreground"
                  title="下载文件"
                >
                  <a href={downloadUrl} target="_blank" rel="noreferrer">
                    <Download className="size-3.5" />
                  </a>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  type="button"
                  size="icon"
                  className="size-8 border-border bg-card text-muted-foreground"
                  title="缺少应用标识，无法生成下载地址"
                  disabled
                >
                  <Download className="size-3.5" />
                </Button>
              )}
              <Button
                variant="outline"
                type="button"
                size="icon"
                className="size-8 border-border bg-card text-muted-foreground"
                title="复制相对路径"
                onClick={() => onCopy(node.path, "相对路径")}
              >
                <Copy className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                type="button"
                size="icon"
                className="size-8 border-border bg-card text-muted-foreground"
                title="复制 Object Key"
                disabled={!objectKey}
                onClick={() => onCopy(objectKey, "Object Key")}
              >
                <HardDrive className="size-3.5" />
              </Button>
            </>
          ) : null}
        </div>
      </div>
      {isExpanded
        ? children.map((child) => (
            <ArtifactTreeNodeRow
              key={child.path}
              applicationSlug={applicationSlug}
              build={build}
              node={child}
              depth={depth + 1}
              expandedPaths={expandedPaths}
              forceExpanded={forceExpanded}
              onCopy={onCopy}
              onToggle={onToggle}
            />
          ))
        : null}
    </div>
  );
}

function filterArtifactTreeNodes(
  nodes: BuildArtifactTreeNode[],
  query: string,
): BuildArtifactTreeNode[] {
  const filteredNodes: BuildArtifactTreeNode[] = [];

  for (const node of nodes) {
    const children = filterArtifactTreeNodes(node.children ?? [], query);
    const isMatch = artifactNodeMatchesSearch(node, query);
    if (isMatch || children.length > 0) {
      filteredNodes.push({
        ...node,
        children: isMatch ? node.children : children,
      });
    }
  }

  return filteredNodes;
}

function artifactNodeMatchesSearch(node: BuildArtifactTreeNode, query: string) {
  return [node.name, node.path, node.objectKey ?? "", node.sha256 ?? "", node.contentType ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function formatArtifactContentType(contentType?: string) {
  const normalizedContentType = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!normalizedContentType) {
    return "文件";
  }

  const contentTypeLabels: Record<string, string> = {
    "application/javascript": "JavaScript",
    "application/json": "JSON",
    "application/octet-stream": "二进制文件",
    "application/wasm": "WASM",
    "application/x-javascript": "JavaScript",
    "application/zip": "ZIP 压缩包",
    "font/otf": "字体文件",
    "font/ttf": "字体文件",
    "font/woff": "字体文件",
    "font/woff2": "字体文件",
    "image/jpeg": "JPEG 图片",
    "image/png": "PNG 图片",
    "image/svg+xml": "SVG 图片",
    "image/webp": "WebP 图片",
    "text/css": "CSS",
    "text/html": "HTML",
    "text/javascript": "JavaScript",
    "text/plain": "文本文件",
    "video/mp4": "MP4 视频",
  };

  if (contentTypeLabels[normalizedContentType]) {
    return contentTypeLabels[normalizedContentType];
  }

  const category = normalizedContentType.split("/")[0];
  if (category === "audio") {
    return "音频文件";
  }
  if (category === "image") {
    return "图片文件";
  }
  if (category === "text") {
    return "文本文件";
  }
  if (category === "video") {
    return "视频文件";
  }

  return "文件";
}

function countArtifactFiles(nodes: BuildArtifactTreeNode[]) {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "file") {
      count += 1;
    }
    count += countArtifactFiles(node.children ?? []);
  }
  return count;
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

function getArtifactFileDownloadURL(
  build: BuildRecordDetail,
  node: BuildArtifactTreeNode,
  applicationSlug: string,
  objectKey: string,
) {
  const publicBaseURL = getPublicBaseURL(build);
  if (publicBaseURL && objectKey) {
    return `${publicBaseURL}/${objectKey}`;
  }

  if (!applicationSlug || !build.moduleId || !build.environment || !build.id || !node.path) {
    return "";
  }

  const params = new URLSearchParams({ path: node.path });
  return `${apiBaseUrl}/api/v1/artifacts/applications/${encodeURIComponent(
    applicationSlug,
  )}/modules/${encodeURIComponent(build.moduleId)}/environments/${encodeURIComponent(
    build.environment,
  )}/builds/${encodeURIComponent(build.id)}/file?${params.toString()}`;
}

function getArtifactBaseURL(build: BuildRecordDetail) {
  return getPublicBaseURL(build) || apiBaseUrl;
}

function getStorageConfigurationDisplayName(build: BuildRecordDetail) {
  const name = build.storageConfigurationName.trim();
  const id = build.storageConfigurationId.trim();

  if (!name || name === "-" || name === id || /^storage-[a-f0-9]+$/i.test(name)) {
    return "存储配置";
  }

  return name;
}

function getArtifactObjectKey(build: BuildRecordDetail, node: BuildArtifactTreeNode) {
  const objectKey = node.objectKey?.trim().replace(/^\/+|\/+$/g, "");
  if (objectKey) {
    return objectKey;
  }

  const artifactKey = build.artifact.trim().replace(/^\/+|\/+$/g, "");
  const path = node.path.trim().replace(/^\/+/, "");
  return artifactKey && path ? `${artifactKey}/${path}` : "";
}

function getPublicBaseURL(build: BuildRecordDetail) {
  const artifactUrl = build.artifactUrl.trim().replace(/\/+$/g, "");
  const artifactKey = build.artifact.trim().replace(/^\/+|\/+$/g, "");
  if (!artifactUrl || artifactUrl === "-" || !artifactKey || artifactKey === "-") {
    return "";
  }

  const suffix = `/${artifactKey}`;
  return artifactUrl.endsWith(suffix) ? artifactUrl.slice(0, -suffix.length) : artifactUrl;
}

function isLiveBuildStatus(status?: BuildRunStatus) {
  return status === "queued" || status === "running";
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
      <div className="border-border border-b bg-card px-6 py-5">
        <Button
          variant="ghost"
          type="button"
          className="-ml-2 h-8 gap-2 px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          返回构建管理
        </Button>
      </div>
      <div className="px-6 py-5">
        <Card className="rounded-lg border-border p-8 text-center shadow-sm">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <PackageCheck className="size-5" />
          </div>
          <div className="mt-3 font-semibold text-foreground">
            {isFetching ? "正在加载构建详情" : "未找到构建记录"}
          </div>
          <div className="mt-2 text-muted-foreground text-sm">
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
          <div className="font-medium text-muted-foreground text-sm">{label}</div>
          <div className="mt-2 truncate font-semibold text-foreground text-xl">{value}</div>
          <div className="mt-1 truncate text-muted-foreground text-xs">{description}</div>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </div>
    </Card>
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
  description,
  icon: Icon,
  label,
  onClick,
  value,
  wide = false,
}: {
  description?: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2 rounded-lg border border-border bg-muted px-3 py-2",
        wide && "md:col-span-2",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">{label}</div>
        {onClick ? (
          <Button
            variant="link"
            type="button"
            className="h-auto min-w-0 justify-start break-all p-0 text-left font-semibold text-primary text-sm"
            onClick={onClick}
          >
            {value || "-"}
          </Button>
        ) : (
          <div className="break-all font-semibold text-foreground text-sm">{value || "-"}</div>
        )}
        {description ? (
          <div className="mt-0.5 break-all text-muted-foreground text-xs">{description}</div>
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
