import { apiBaseUrl } from "@/api/client";
import type {
  ActiveFullReleaseTarget,
  BuildArtifactTreeNode,
  BuildRecordDetail,
  BuildRunRecord,
  BuildRunStatus,
} from "../types";

/** 发布路由按模块、环境和运行时版本隔离，同一 key 下的全量发布才会互相替换。 */
export function buildReleaseTargetKey(
  moduleId: string,
  environment: string,
  runtimeVersion: string,
) {
  return `${moduleId}:${environment}:${runtimeVersion}`;
}

export function isBuildOlderThanActiveRelease(
  build: BuildRunRecord,
  activeRelease: ActiveFullReleaseTarget,
) {
  const buildCreatedAt = Date.parse(build.createdAtRaw);
  const activeBuildCreatedAt = Date.parse(activeRelease.build?.createdAtRaw ?? "");

  if (!Number.isNaN(buildCreatedAt) && !Number.isNaN(activeBuildCreatedAt)) {
    return buildCreatedAt < activeBuildCreatedAt;
  }

  return false;
}

export function defaultTargetedGrayExpiresAt() {
  return targetedGrayExpiresAt(7);
}

export function targetedGrayExpiresAt(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return formatDatetimeLocal(value);
}

export function formatDatetimeLocal(value: Date) {
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, "0");
  const day = `${value.getDate()}`.padStart(2, "0");
  const hour = `${value.getHours()}`.padStart(2, "0");
  const minute = `${value.getMinutes()}`.padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export function filterArtifactTreeNodes(
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

export function artifactNodeMatchesSearch(node: BuildArtifactTreeNode, query: string) {
  return [node.name, node.path, node.objectKey ?? "", node.sha256 ?? "", node.contentType ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

export function formatArtifactContentType(contentType?: string) {
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

export function countArtifactFiles(nodes: BuildArtifactTreeNode[]) {
  let count = 0;
  for (const node of nodes) {
    if (node.type === "file") {
      count += 1;
    }
    count += countArtifactFiles(node.children ?? []);
  }
  return count;
}

export function collectDirectoryPaths(nodes: BuildArtifactTreeNode[]) {
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

export function getArtifactFileDownloadURL(
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

export function getArtifactBaseURL(build: BuildRecordDetail) {
  return getPublicBaseURL(build) || apiBaseUrl;
}

export function getStorageConfigurationDisplayName(build: BuildRecordDetail) {
  const name = build.storageConfigurationName.trim();
  const id = build.storageConfigurationId.trim();

  if (!name || name === "-" || name === id || /^storage-[a-f0-9]+$/i.test(name)) {
    return "存储配置";
  }

  return name;
}

export function getArtifactObjectKey(build: BuildRecordDetail, node: BuildArtifactTreeNode) {
  const objectKey = node.objectKey?.trim().replace(/^\/+|\/+$/g, "");
  if (objectKey) {
    return objectKey;
  }

  const artifactKey = build.artifact.trim().replace(/^\/+|\/+$/g, "");
  const path = node.path.trim().replace(/^\/+/, "");
  return artifactKey && path ? `${artifactKey}/${path}` : "";
}

export function getPublicBaseURL(build: BuildRecordDetail) {
  const artifactUrl = build.artifactUrl.trim().replace(/\/+$/g, "");
  const artifactKey = build.artifact.trim().replace(/^\/+|\/+$/g, "");
  if (!artifactUrl || artifactUrl === "-" || !artifactKey || artifactKey === "-") {
    return "";
  }

  const suffix = `/${artifactKey}`;
  return artifactUrl.endsWith(suffix) ? artifactUrl.slice(0, -suffix.length) : artifactUrl;
}

export function isLiveBuildStatus(status?: BuildRunStatus) {
  return status === "queued" || status === "running";
}

export function formatBytes(value: number) {
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
