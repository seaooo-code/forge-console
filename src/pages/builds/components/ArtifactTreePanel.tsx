import {
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Copy,
  Download,
  File,
  Folder,
  HardDrive,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { BuildArtifactTreeNode, BuildRecordDetail } from "../types";
import {
  collectDirectoryPaths,
  countArtifactFiles,
  filterArtifactTreeNodes,
  formatArtifactContentType,
  formatBytes,
  getArtifactFileDownloadURL,
  getArtifactObjectKey,
} from "../utils";
import { SectionHeader } from "./BuildDetailSummary";

export function ArtifactTreePanel({
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
