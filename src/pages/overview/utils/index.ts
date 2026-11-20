import { formatDistanceToNowStrict } from "date-fns";
import { zhCN } from "date-fns/locale";

import type { CodeSourceConnection } from "@/pages/code-sources";
import type { BuildRunRecord } from "@/types/builds";
import type { ModuleRecord } from "@/types/modules";

import { credentialExpiringWithinMs } from "../constants";
import type {
  AttentionItem,
  CandidateAction,
  CellKey,
  OverviewModel,
  RouteCell,
  RouteEntry,
} from "../types";

export const cellId = ({ environment, moduleId }: CellKey) => `${moduleId}::${environment}`;

/** 运行时版本按数值从新到旧排，构建成功前还没有版本号的构建不参与。 */
export function collectRuntimeVersions(model: Pick<OverviewModel, "builds" | "releases">) {
  const versions = new Set<string>();
  for (const release of model.releases) {
    if (release.runtimeVersion) versions.add(release.runtimeVersion);
  }
  for (const build of model.builds) {
    if (build.status === "success" && build.runtimeVersion) versions.add(build.runtimeVersion);
  }
  return [...versions].sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
}

/** 按「模块 × 环境」整理一个运行时版本下的生效路由。 */
export function buildRouteCells(model: OverviewModel, runtimeVersion: string) {
  const buildsById = new Map(model.builds.map((build) => [build.id, build]));
  const cells = new Map<string, RouteCell>();

  for (const release of model.releases) {
    if (release.status !== "active" || release.runtimeVersion !== runtimeVersion) continue;
    const key = cellId({ environment: release.environment, moduleId: release.moduleId });
    const cell = cells.get(key) ?? {
      environment: release.environment,
      full: null,
      moduleId: release.moduleId,
      percentage: null,
    };
    const entry: RouteEntry = { build: buildsById.get(release.buildRecordId) ?? null, release };
    if (release.releaseType === "full") cell.full = entry;
    else if (release.grayStrategy === "percentage") cell.percentage = entry;
    cells.set(key, cell);
  }

  return cells;
}

export const isEmptyCell = (cell: RouteCell | undefined) =>
  !cell || (!cell.full && !cell.percentage);

/** 格子里列出的构建：同一运行时版本的成功构建，加上还没产出版本号的排队、进行中和失败构建。 */
export function cellBuilds(builds: BuildRunRecord[], key: CellKey, runtimeVersion: string) {
  return builds
    .filter(
      (build) =>
        build.moduleId === key.moduleId &&
        build.environment === key.environment &&
        (build.status === "success" ? build.runtimeVersion === runtimeVersion : true),
    )
    .sort((a, b) => b.number - a.number);
}

export function routeUsages(cell: RouteCell | undefined, buildId: string) {
  if (!cell) return [];
  const usages: { kind: "full" | "percentage"; label: string }[] = [];
  if (cell.full?.release.buildRecordId === buildId) usages.push({ kind: "full", label: "全量" });
  if (cell.percentage?.release.buildRecordId === buildId) {
    usages.push({ kind: "percentage", label: `比例 ${cell.percentage.release.grayPercentage}%` });
  }
  return usages;
}

export function candidateAction(
  build: BuildRunRecord,
  cell: RouteCell | undefined,
): CandidateAction {
  if (build.status === "queued" || build.status === "running") return { kind: "busy" };
  if (build.status === "failed") return { kind: "failed" };
  const full = cell?.full;
  if (full?.release.buildRecordId === build.id) return { kind: "current" };
  const fullNumber = full?.build?.number;
  if (fullNumber !== undefined && build.number < fullNumber) return { kind: "rollback" };
  return { kind: "release" };
}

/** 比当前全量更新、且还没被任何路由使用的成功构建数。 */
export function newerBuildCount(builds: BuildRunRecord[], cell: RouteCell | undefined) {
  const base = cell?.full?.build?.number ?? 0;
  return builds.filter(
    (build) =>
      build.status === "success" && build.number > base && routeUsages(cell, build.id).length === 0,
  ).length;
}

/** 代码托管平台上两个 commit 之间的对比页；缺 commit 或仓库地址时返回空字符串。 */
export function compareUrl(module: ModuleRecord | undefined, from: string, to: string) {
  const web = module?.repositoryWebUrl?.trim().replace(/\/+$/, "");
  if (!web || !from || !to || from === to) return "";
  const range = `${encodeURIComponent(from)}...${encodeURIComponent(to)}`;
  return module?.repositoryProvider === "gitlab"
    ? `${web}/-/compare/${range}`
    : `${web}/compare/${range}`;
}

export function relativeTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: zhCN });
}

export function expiresInLabel(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  if (date.getTime() <= Date.now()) return "已过期";
  return `${formatDistanceToNowStrict(date, { locale: zhCN })}后过期`;
}

/** 首页「需要处理」：每个格子最近一次构建失败、即将过期的代码源凭证。 */
export function collectAttentionItems(
  model: OverviewModel,
  connections: CodeSourceConnection[],
  now = Date.now(),
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const modulesById = new Map(model.modules.map((module) => [module.id, module]));

  const latestByCell = new Map<string, BuildRunRecord>();
  for (const build of model.builds) {
    const key = cellId({ environment: build.environment, moduleId: build.moduleId });
    const latest = latestByCell.get(key);
    if (!latest || build.number > latest.number) latestByCell.set(key, build);
  }
  for (const build of latestByCell.values()) {
    if (build.status === "failed") {
      items.push({
        build,
        id: `build-${build.id}`,
        kind: "build-failed",
        module: modulesById.get(build.moduleId) ?? null,
      });
    }
  }

  for (const connection of connections) {
    if (connection.status !== "active" || !connection.credentialExpiresAt) continue;
    const expiresAt = new Date(connection.credentialExpiresAt).getTime();
    if (Number.isNaN(expiresAt) || expiresAt - now > credentialExpiringWithinMs) continue;
    items.push({ connection, id: `connection-${connection.id}`, kind: "credential-expiring" });
  }

  return items;
}
