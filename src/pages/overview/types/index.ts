import type { CodeSourceConnection } from "@/pages/code-sources";
import type { RuntimeEnvironment } from "@/pages/environments";
import type { ReleasePointerRecord } from "@/pages/release-records";
import type { BuildRunRecord } from "@/types/builds";
import type { ModuleRecord } from "@/types/modules";

/** 一条生效中的路由：发布记录加上它指向的构建（构建可能已不在列表里）。 */
export type RouteEntry = {
  build: BuildRunRecord | null;
  release: ReleasePointerRecord;
};

/** 模块在某个环境、某个运行时版本下的访问路由。匹配顺序：比例 → 全量。 */
export type RouteCell = {
  environment: string;
  full: RouteEntry | null;
  moduleId: string;
  percentage: RouteEntry | null;
};

/** 网格里的一行一列：模块 × 环境，不区分运行时版本（例如「需要处理」里的失败构建还没有版本号）。 */
export type CellLocation = {
  environment: string;
  moduleId: string;
};

/** 网格里的一个格子：运行时版本分段 × 模块 × 环境。 */
export type CellKey = CellLocation & {
  runtimeVersion: string;
};

/** 线上现状按运行时版本分段，每段是一组兼容的通用包和功能包。 */
export type RuntimeGroup = {
  /** 默认渠道下生效中的路由数（全量和比例灰度各算一条）。 */
  activeRoutes: number;
  /** 有生效路由的版本默认展示，其余收进「历史版本」。 */
  isActive: boolean;
  /** 最近一次发布或成功构建的时间，用于排序。 */
  lastActivityRaw: string;
  runtimeVersion: string;
};

export type OverviewModel = {
  builds: BuildRunRecord[];
  environments: RuntimeEnvironment[];
  modules: ModuleRecord[];
  releases: ReleasePointerRecord[];
};

export type AttentionItem =
  | { build: BuildRunRecord; id: string; kind: "build-failed"; module: ModuleRecord | null }
  | { connection: CodeSourceConnection; id: string; kind: "credential-expiring" };

export type ReleaseKind = "full" | "percentage";

export type ReleaseComposerForm = {
  grayPercentage: number;
  kind: ReleaseKind;
};

export type GrayPercentageForm = {
  grayPercentage: number;
};

/** 候选构建在当前格子里能做的事。 */
export type CandidateAction =
  | { kind: "busy" }
  | { kind: "failed" }
  | { kind: "current" }
  | { kind: "release" }
  | { kind: "rollback" };
