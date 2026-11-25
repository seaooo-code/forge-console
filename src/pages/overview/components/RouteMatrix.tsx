import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RuntimeEnvironment } from "@/pages/environments";
import type { BuildRunRecord } from "@/types/builds";
import type { ModuleRecord } from "@/types/modules";

import { environmentDotClass } from "../constants";
import type { CellKey, RouteCell, RuntimeGroup } from "../types";
import { cellBuilds, cellId, isEmptyCell, newerBuildCount, relativeTime } from "../utils";

type RouteMatrixProps = {
  builds: BuildRunRecord[];
  cells: Map<string, RouteCell>;
  environments: RuntimeEnvironment[];
  /** 收进「历史版本」的分段，展开时画在默认分段下面。 */
  history: RuntimeGroup[];
  isHistoryOpen: boolean;
  /** 默认展示的分段，顺序即展示顺序。 */
  leading: RuntimeGroup[];
  modules: ModuleRecord[];
  onSelect: (key: CellKey) => void;
  onToggleHistory: () => void;
  /** 还没有版本号的排队、构建中构建显示在这一段。 */
  pendingRuntimeVersion: string;
  selected: CellKey | null;
};

export function RouteMatrix({
  builds,
  cells,
  environments,
  history,
  isHistoryOpen,
  leading,
  modules,
  onSelect,
  onToggleHistory,
  pendingRuntimeVersion,
  selected,
}: RouteMatrixProps) {
  const columns = { gridTemplateColumns: `11rem repeat(${environments.length}, minmax(0, 1fr))` };

  const renderGroup = (group: RuntimeGroup, isHistory: boolean) => (
    <section
      key={group.runtimeVersion || "none"}
      aria-label={group.runtimeVersion ? `运行时版本 ${group.runtimeVersion}` : "模块与环境"}
      className={cn("flex flex-col gap-2.5", isHistory && "opacity-80")}
    >
      {group.runtimeVersion ? (
        <div className="flex items-baseline gap-2 px-2.5 pt-1 text-xs">
          <span className="font-medium font-mono text-foreground text-sm">
            {group.runtimeVersion}
          </span>
          <span className={group.isActive ? "text-muted-foreground" : "text-faint"}>
            {group.isActive ? `${group.activeRoutes} 条生效路由` : "没有生效中的发布"}
          </span>
          {group.lastActivityRaw ? (
            <span className="text-faint">· 最近活动 {relativeTime(group.lastActivityRaw)}</span>
          ) : null}
        </div>
      ) : null}
      {modules.map((module) => (
        <div
          key={module.id}
          className="grid gap-1 rounded-2xl bg-card p-1.5 shadow-edge"
          style={columns}
        >
          <div className="min-w-0 px-2.5 pt-2.5 pb-2">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-medium text-sm">{module.name}</span>
              <span className="shrink-0 rounded bg-muted px-1.5 text-muted-foreground text-xs">
                {module.kind === "Common" ? "通用" : "功能"}
              </span>
            </div>
            <p className="m-0 mt-1 truncate font-mono text-faint text-xs">
              {module.repositoryFullName || module.repository}
            </p>
          </div>
          {environments.map((env) => {
            const key = {
              environment: env.id,
              moduleId: module.id,
              runtimeVersion: group.runtimeVersion,
            };
            const id = cellId(key);
            return (
              <Cell
                key={env.id}
                builds={cellBuilds(builds, key, group.runtimeVersion === pendingRuntimeVersion)}
                cell={cells.get(id)}
                id={id}
                label={`${module.name} ${env.name}${group.runtimeVersion ? ` ${group.runtimeVersion}` : ""}`}
                onSelect={() => onSelect(key)}
                selected={Boolean(selected && cellId(selected) === id)}
              />
            );
          })}
        </div>
      ))}
    </section>
  );

  return (
    <section aria-label="模块与环境" className="mt-7">
      <div className="grid gap-1 px-1.5 pb-2" style={columns}>
        <div className="px-2.5 text-muted-foreground text-xs">模块</div>
        {environments.map((env) => (
          <div
            key={env.id}
            className="flex items-center gap-1.5 px-3 text-muted-foreground text-xs"
          >
            <i className={cn("size-2 rounded-sm", environmentDotClass[env.tone])} />
            {env.name}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5">
        {leading.map((group) => renderGroup(group, false))}
        {history.length ? (
          <Fragment>
            <Button
              variant="ghost"
              size="sm"
              aria-expanded={isHistoryOpen}
              onClick={onToggleHistory}
              className="h-7 self-start px-2.5 font-normal text-muted-foreground text-xs"
            >
              <ChevronRight
                className={cn("size-3.5 transition-transform", isHistoryOpen && "rotate-90")}
              />
              历史版本（{history.length}）
              {isHistoryOpen ? null : (
                <span className="font-mono text-faint">
                  {history
                    .slice(0, 3)
                    .map((group) => group.runtimeVersion)
                    .join("、")}
                  {history.length > 3 ? " …" : ""}
                </span>
              )}
            </Button>
            {isHistoryOpen ? history.map((group) => renderGroup(group, true)) : null}
          </Fragment>
        ) : null}
      </div>

      <div className="flex items-center gap-4 px-1.5 pt-2 text-muted-foreground text-xs">
        <Legend className="bg-primary" label="全量" />
        <Legend className="bg-route-percentage" label="比例灰度" />
        <span className="ml-auto text-faint">方向键切换格子，Esc 收起发布面板</span>
      </div>
    </section>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className={cn("h-1.5 w-3.5 rounded-full", className)} />
      {label}
    </span>
  );
}

type CellProps = {
  builds: BuildRunRecord[];
  cell: RouteCell | undefined;
  id: string;
  label: string;
  onSelect: () => void;
  selected: boolean;
};

function Cell({ builds, cell, id, label, onSelect, selected }: CellProps) {
  const running = builds.find((build) => build.status === "running" || build.status === "queued");
  const newer = newerBuildCount(builds, cell);
  const hasBuilds = builds.some((build) => build.status === "success");

  return (
    <Button
      variant="ghost"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={selected}
      data-cell-id={id}
      className={cn(
        "h-auto min-h-22 w-full min-w-0 flex-col items-stretch justify-start gap-0 whitespace-normal rounded-xl px-3 py-2.5 text-left font-normal",
        "hover:bg-hover",
        selected && "bg-primary-soft ring-2 ring-primary ring-inset hover:bg-primary-soft",
      )}
    >
      {isEmptyCell(cell) ? (
        <span className="m-auto text-faint text-xs">
          {hasBuilds ? "未发布 · 有可发布的构建" : "未发布"}
        </span>
      ) : (
        <>
          {cell?.full ? (
            <Lane
              commitTitle={cell.full.release.commit.title}
              meta={relativeTime(cell.full.release.updatedAtRaw)}
              number={cell.full.build?.number}
              tagClass="text-primary-text"
              tag="全量"
            />
          ) : (
            <Lane tag="没有全量" tagClass="text-faint" />
          )}
          {cell?.percentage ? (
            <>
              <SplitBar percentage={cell.percentage.release.grayPercentage} />
              <Lane
                commitTitle={cell.percentage.release.commit.title}
                number={cell.percentage.build?.number}
                tag={`比例 ${cell.percentage.release.grayPercentage}%`}
                tagClass="text-route-percentage"
              />
            </>
          ) : null}
        </>
      )}
      {newer || running ? (
        <span className="mt-auto flex flex-wrap gap-x-2.5 pt-1.5 text-xs">
          {newer ? (
            <span className="font-medium text-primary-text">{newer} 个新构建可发布</span>
          ) : null}
          {running ? (
            <span className="inline-flex items-center gap-1 text-info">
              <i className="size-1.5 rounded-full bg-info" />#{running.number}{" "}
              {running.status === "queued" ? "排队中" : "构建中"}
            </span>
          ) : null}
        </span>
      ) : null}
    </Button>
  );
}

function Lane({
  commitTitle,
  meta,
  number,
  tag,
  tagClass,
}: {
  /** 这条路由所用构建的提交说明，旧构建没有记录时不展示。 */
  commitTitle?: string;
  meta?: string;
  number?: number;
  tag: string;
  tagClass: string;
}) {
  return (
    <span className="flex min-w-0 flex-col" title={commitTitle || undefined}>
      <span className="flex min-w-0 items-baseline gap-1.5 text-xs leading-relaxed">
        {number !== undefined ? (
          <span className="font-medium text-foreground text-sm tabular-nums">#{number}</span>
        ) : null}
        <span className={cn("min-w-0 truncate", tagClass)}>{tag}</span>
        {meta ? <span className="ml-auto shrink-0 text-faint">{meta}</span> : null}
      </span>
      {commitTitle ? (
        <span className="min-w-0 truncate text-[11px] text-faint leading-snug">{commitTitle}</span>
      ) : null}
    </span>
  );
}

export function SplitBar({ className, percentage }: { className?: string; percentage: number }) {
  return (
    <span className={cn("my-1 flex h-1.5 w-full gap-0.5", className)}>
      <i className="rounded-full bg-primary" style={{ width: `${100 - percentage}%` }} />
      <i className="rounded-full bg-route-percentage" style={{ width: `${percentage}%` }} />
    </span>
  );
}
