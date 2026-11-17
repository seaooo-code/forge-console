import { normalizeBuildRecord } from "@/api/builds";
import { type APIErrorPayload, type APISchemas, createFetchClient } from "@/api/client";
import type {
  BuildArtifactTree,
  BuildArtifactTreeNode,
  BuildLogState,
  BuildRecordDetail,
} from "../types";

export const buildDetailQueryKey = (buildId: string) => ["build-detail", buildId] as const;

export const buildLogsQueryKey = (buildId: string) => ["build-logs", buildId] as const;

type BuildRecordAPIRecord = APISchemas["BuildRecord"];

type BuildArtifactTreeAPIRecord = APISchemas["BuildArtifactTree"];

type BuildArtifactTreeNodeAPIRecord = APISchemas["BuildArtifactTreeNode"];

type BuildDetailAPIResponse = APISchemas["BuildRecordDetailResponse"];

type BuildLogsAPIResponse = APISchemas["BuildLogsResponse"];

/** 后端单次最多返回的日志分片数，返回满一页时说明后面可能还有，需要继续读。 */
const buildLogsPageLimit = 100;

/** 单次轮询最多连续读取的页数，避免日志积压时一次请求链过长。 */
const buildLogsMaxPagesPerFetch = 20;

export class BuildAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(getBuildAPIErrorMessage(path, status, payload));
    this.name = "BuildAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new BuildAPIError(path, status, payload),
);

export async function fetchBuildDetail(buildId: string): Promise<BuildRecordDetail> {
  const payload = await fetchJSON<BuildDetailAPIResponse>(
    `/api/v1/builds/${encodeURIComponent(buildId)}`,
  );

  return normalizeBuildDetail(payload.build);
}

/**
 * 从 previous 记录的最后一个 seq 之后增量读取日志，并拼接到已有内容上。
 * 返回满一页时立即继续读下一页，直到读空、读完或达到单次上限。
 */
export async function fetchBuildLogsAfter(
  buildId: string,
  previous?: BuildLogState,
): Promise<BuildLogState> {
  let content = previous?.content ?? "";
  let lastSeq = previous?.lastSeq;
  let finished = false;

  for (let page = 0; page < buildLogsMaxPagesPerFetch; page += 1) {
    const params = new URLSearchParams();
    if (lastSeq !== undefined) {
      params.set("afterSeq", String(lastSeq));
    }
    const query = params.toString();
    const payload = await fetchJSON<BuildLogsAPIResponse>(
      `/api/v1/builds/${encodeURIComponent(buildId)}/logs${query ? `?${query}` : ""}`,
    );

    for (const chunk of payload.chunks) {
      content += chunk.content;
      lastSeq = chunk.seq;
    }
    finished = payload.finished;

    if (finished || payload.chunks.length < buildLogsPageLimit) {
      break;
    }
  }

  return { content, finished, lastSeq };
}

const buildAPIErrorMessages: Record<string, string> = {
  "build log service unavailable": "构建日志服务暂不可用",
  "build record not found": "构建记录不存在",
  "build service unavailable": "构建服务暂不可用",
  "environment not found": "环境不存在",
  forbidden: "当前账号无权限执行此操作",
  "internal server error": "服务端内部错误，请稍后重试",
  "invalid build request": "构建参数无效，请检查模块、分支和环境",
  "invalid release request": "发布参数无效，请确认构建状态、发布类型和灰度配置",
  "release already active": "该构建已是当前发布目标的生效版本，没有新的路由变化",
  "module not found": "模块不存在",
  "release route not found": "发布路由不存在",
  "release service unavailable": "发布服务暂不可用",
  "storage configuration not found": "环境未绑定有效存储配置，无法构建",
};

function getBuildAPIErrorMessage(path: string, status: number, payload?: APIErrorPayload) {
  const error = payload?.error;
  if (error && buildAPIErrorMessages[error]) {
    return buildAPIErrorMessages[error];
  }
  return error ?? `Request ${path} failed with ${status}`;
}

function normalizeBuildDetail(record: BuildRecordAPIRecord): BuildRecordDetail {
  return {
    ...normalizeBuildRecord(record),
    artifactTree: normalizeArtifactTree(
      record.artifactTree,
      record.fileCount,
      record.totalSizeBytes,
    ),
    createdAt: formatRecordNumber(record.createdAt),
    defaultBranch: record.defaultBranch || "-",
    dependencyBuilds: record.dependencyBuilds ?? [],
    environment: record.environment || "-",
    environmentName: record.environmentName || record.environment || "-",
    errorMessage: record.errorMessage || "",
    artifactUrl: record.artifactUrl || "-",
    fileCount: record.fileCount ?? 0,
    finishedAt: formatFullTime(record.finishedAt),
    manifestKey: record.manifestKey || "",
    moduleId: record.moduleId,
    queuedAt: formatFullTime(record.queuedAt),
    repositoryFullName: record.repositoryFullName || "-",
    repositoryId: record.repositoryId || "-",
    codeSourceConnectionId: record.codeSourceConnectionId || "-",
    repositoryProvider: record.repositoryProvider,
    startedAtFull: formatFullTime(record.startedAt),
    startedAtRaw: record.startedAt ?? "",
    storageConfigurationId: record.storageConfigurationId || "-",
    storageConfigurationName: record.storageConfigurationName || "-",
    totalSizeBytes: record.totalSizeBytes ?? 0,
    updatedAt: formatFullTime(record.updatedAt),
    workerId: record.workerId || "-",
  };
}

function normalizeArtifactTree(
  tree: BuildArtifactTreeAPIRecord | undefined,
  fileCount: number | undefined,
  totalSizeBytes: number | undefined,
): BuildArtifactTree {
  return {
    fileCount: tree?.fileCount ?? fileCount ?? 0,
    nodes: tree?.nodes?.map(normalizeArtifactTreeNode) ?? [],
    totalSizeBytes: tree?.totalSizeBytes ?? totalSizeBytes ?? 0,
  };
}

function normalizeArtifactTreeNode(node: BuildArtifactTreeNodeAPIRecord): BuildArtifactTreeNode {
  return {
    children: node.children?.map(normalizeArtifactTreeNode),
    contentType: node.contentType || undefined,
    name: node.name,
    objectKey: node.objectKey || undefined,
    path: node.path,
    sha256: node.sha256 || undefined,
    sizeBytes: node.sizeBytes,
    type: node.type,
  };
}

function formatFullTime(value?: string) {
  return formatRecordNumber(value);
}

function formatRecordNumber(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  const second = `${date.getSeconds()}`.padStart(2, "0");
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}
