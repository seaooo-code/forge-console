import { formatDistanceToNowStrict } from "date-fns";
import { zhCN } from "date-fns/locale";

import type { CodeSourceConnection } from "@/pages/code-sources";
import type { BuildRunRecord } from "@/types/builds";

import { credentialExpiringWithinMs } from "../constants";
import type {
  AttentionItem,
  CandidateAction,
  CellKey,
  OverviewModel,
  RouteCell,
  RouteEntry,
  RuntimeGroup,
} from "../types";

export const cellId = ({ environment, moduleId, runtimeVersion }: CellKey) =>
  `${runtimeVersion}::${moduleId}::${environment}`;

const laterTime = (a: string, b: string) => (Date.parse(b) > Date.parse(a) || !a ? b : a);

/**
 * 把出现过的运行时版本整理成网格分段：有生效路由的版本在前，按最近活动从新到旧；
 * 没有生效路由的版本（发布都已停用，或只有构建）排在后面，默认收进「历史版本」。
 * 构建成功前还没有版本号的构建不参与。
 */
export function collectRuntimeGroups(model: Pick<OverviewModel, "builds" | "releases">) {
  const groups = new Map<string, RuntimeGroup>();
  const touch = (runtimeVersion: string, at: string) => {
    if (!runtimeVersion) return undefined;
    const group = groups.get(runtimeVersion) ?? {
      activeRoutes: 0,
      isActive: false,
      lastActivityRaw: "",
      runtimeVersion,
    };
    group.lastActivityRaw = laterTime(group.lastActivityRaw, at);
    groups.set(runtimeVersion, group);
    return group;
  };
  for (const release of model.releases) {
    const group = touch(release.runtimeVersion, release.updatedAtRaw || release.createdAtRaw);
    if (group && release.status === "active" && release.channel === "") {
      group.activeRoutes += 1;
      group.isActive = true;
    }
  }
  for (const build of model.builds) {
    if (build.status === "success") touch(build.runtimeVersion, build.createdAtRaw);
  }
  return [...groups.values()].sort(
    (a, b) =>
      Number(b.isActive) - Number(a.isActive) ||
      (Date.parse(b.lastActivityRaw) || 0) - (Date.parse(a.lastActivityRaw) || 0) ||
      b.runtimeVersion.localeCompare(a.runtimeVersion, undefined, { numeric: true }),
  );
}

/**
 * 分成默认展示的分段和收起的历史版本。应用还没有任何生效发布时，最近活动的版本仍然默认展示；
 * 一个版本都没有时（还没有成功构建），给一段没有版本号的空网格，模块照常列出。
 */
export function splitRuntimeGroups(groups: RuntimeGroup[]) {
  const active = groups.filter((group) => group.isActive);
  const inactive = groups.filter((group) => !group.isActive);
  if (active.length) return { history: inactive, leading: active };
  if (inactive.length) return { history: inactive.slice(1), leading: inactive.slice(0, 1) };
  const empty: RuntimeGroup = {
    activeRoutes: 0,
    isActive: false,
    lastActivityRaw: "",
    runtimeVersion: "",
  };
  return { history: [], leading: [empty] };
}

/** 按「运行时版本 × 模块 × 环境」整理默认渠道的生效路由；渠道发布在发布记录页查看。 */
export function buildRouteCells(model: OverviewModel) {
  const buildsById = new Map(model.builds.map((build) => [build.id, build]));
  const cells = new Map<string, RouteCell>();

  for (const release of model.releases) {
    if (release.status !== "active" || !release.runtimeVersion || release.channel !== "") continue;
    const key = cellId({
      environment: release.environment,
      moduleId: release.moduleId,
      runtimeVersion: release.runtimeVersion,
    });
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

/**
 * 格子里列出的构建：同一运行时版本的成功构建。还没产出版本号的排队、进行中和失败构建不知道属于哪个版本，
 * 只在 includePending 为 true 时列出（线上现状只放进最上面那一段，避免每段重复出现）。
 */
export function cellBuilds(builds: BuildRunRecord[], key: CellKey, includePending: boolean) {
  return builds
    .filter(
      (build) =>
        build.moduleId === key.moduleId &&
        build.environment === key.environment &&
        (build.status === "success" ? build.runtimeVersion === key.runtimeVersion : includePending),
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
    const key = `${build.moduleId}::${build.environment}`;
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
