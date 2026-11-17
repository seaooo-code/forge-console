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

/** 模块在某个环境、某个运行时版本下的访问路由。匹配顺序：定向 → 比例 → 全量。 */
export type RouteCell = {
  environment: string;
  full: RouteEntry | null;
  moduleId: string;
  percentage: RouteEntry | null;
  targeted: RouteEntry[];
};

export type CellKey = {
  environment: string;
  moduleId: string;
};

export type OverviewModel = {
  builds: BuildRunRecord[];
  environments: RuntimeEnvironment[];
  modules: ModuleRecord[];
  releases: ReleasePointerRecord[];
};

export type AttentionItem =
  | { build: BuildRunRecord; id: string; kind: "build-failed"; module: ModuleRecord | null }
  | { entry: RouteEntry; id: string; kind: "targeted-expiring" }
  | { connection: CodeSourceConnection; id: string; kind: "credential-expiring" };

export type ReleaseKind = "full" | "percentage" | "targeted";

export type ReleaseComposerForm = {
  expiresInDays: number;
  grayPercentage: number;
  identifier: string;
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
