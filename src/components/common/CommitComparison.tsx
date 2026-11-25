import { skipToken, useQuery } from "@tanstack/react-query";
import { ExternalLink, GitCompareArrows, LoaderCircle } from "lucide-react";

import {
  compareModuleCommits,
  type ModuleCommitComparison,
  ModulesAPIError,
  moduleCommitComparisonQueryKey,
} from "@/api/modules";
import { cn } from "@/lib/utils";

import { CommitLink, commitByline } from "./CommitInfo";

type CommitComparisonProps = {
  className?: string;
  /** 基准提交，一般是线上版本。 */
  from: string;
  fromLabel?: string;
  moduleId: string;
  /** 目标提交，一般是待发布或正在查看的构建。 */
  to: string;
  toLabel?: string;
};

/**
 * 列出两个提交之间相差的提交：to 比 from 新时是新增的提交，比 from 旧（回退）时是会被撤掉的提交。
 * 最多展示最新的 50 条，更多的到托管平台的对比页看。
 */
export function CommitComparison({
  className,
  from,
  fromLabel = "线上版本",
  moduleId,
  to,
  toLabel = "这个构建",
}: CommitComparisonProps) {
  const shouldFetch = moduleId !== "" && from !== "" && to !== "";
  const {
    data: comparison,
    error,
    isPending,
  } = useQuery({
    queryFn: shouldFetch ? () => compareModuleCommits(moduleId, from, to) : skipToken,
    queryKey: moduleCommitComparisonQueryKey(moduleId, from, to),
    retry: false,
    staleTime: 60_000,
  });

  if (!shouldFetch) {
    return null;
  }
  if (isPending) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground text-xs", className)}>
        <LoaderCircle className="size-3.5 animate-spin" />
        正在比较{toLabel}和{fromLabel}的提交
      </div>
    );
  }
  if (error) {
    const missing = error instanceof ModulesAPIError && error.status === 404;
    return (
      <div className={cn(missing ? "text-warning" : "text-destructive", "text-xs", className)}>
        {missing
          ? "仓库里找不到其中一个提交（可能被强制推送覆盖），无法比较"
          : `比较提交失败：${error.message}`}
      </div>
    );
  }
  if (!comparison) {
    return null;
  }

  const total = `${comparison.totalCommits}${comparison.totalExact ? "" : "+"}`;
  const behindTotal = `${comparison.behindBy}${comparison.behindExact ? "" : "+"}`;
  const summary = {
    ahead: `${toLabel}比${fromLabel}新 ${total} 个提交`,
    behind: `${toLabel}比${fromLabel}旧 ${total} 个提交，发布后这些提交会被撤下`,
    diverged: `${toLabel}和${fromLabel}不在同一条提交线上：发布后新增 ${total} 个提交，撤下 ${behindTotal} 个${fromLabel}独有的提交`,
    identical: `${toLabel}和${fromLabel}是同一个提交`,
  }[comparison.status];
  const isRisky = comparison.status === "behind" || comparison.status === "diverged";

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex min-w-0 items-start gap-1.5 text-xs",
            isRisky ? "text-warning" : "text-muted-foreground",
          )}
        >
          <GitCompareArrows className="mt-px size-3.5 shrink-0" />
          <span>{summary}</span>
        </div>
        {comparison.webUrl && comparison.status !== "identical" ? (
          <a
            href={comparison.webUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-primary text-xs hover:underline"
          >
            完整对比
            <ExternalLink className="size-3" />
          </a>
        ) : null}
      </div>
      {comparison.status === "diverged" ? (
        <>
          <CommitList
            commits={comparison.commits}
            exact={comparison.totalExact}
            title={`发布后新增（${total}）`}
            total={comparison.totalCommits}
          />
          <CommitList
            commits={comparison.behindCommits}
            exact={comparison.behindExact}
            title={`发布后撤下（${behindTotal}）：${fromLabel}有、${toLabel}没有`}
            tone="warning"
            total={comparison.behindBy}
          />
        </>
      ) : (
        <CommitList
          commits={comparison.commits}
          exact={comparison.totalExact}
          total={comparison.totalCommits}
        />
      )}
    </div>
  );
}

/** 差异提交列表，新的在前；只展示最新的一部分时提示到完整对比里看。 */
function CommitList({
  commits,
  exact,
  title,
  tone,
  total,
}: {
  commits: ModuleCommitComparison["commits"];
  exact: boolean;
  title?: string;
  tone?: "warning";
  total: number;
}) {
  if (commits.length === 0) {
    return null;
  }
  return (
    <div className="space-y-1">
      {title ? (
        <div
          className={cn("text-xs", tone === "warning" ? "text-warning" : "text-muted-foreground")}
        >
          {title}
        </div>
      ) : null}
      <ol
        className={cn(
          "max-h-64 divide-y overflow-auto rounded-lg border",
          tone === "warning" && "border-warning/40",
        )}
      >
        {commits.map((item) => {
          const commit = {
            authorName: item.authorName,
            committedAt: item.committedAt,
            sha: item.sha,
            title: item.title,
            url: item.webUrl,
          };
          return (
            <li key={item.sha} className="flex items-start gap-2.5 px-3 py-2">
              <CommitLink commit={commit} className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="break-words text-foreground text-xs">
                  {item.title || "（无提交说明）"}
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                  {commitByline(commit)}
                </div>
              </div>
            </li>
          );
        })}
        {total > commits.length || !exact ? (
          <li className="px-3 py-2 text-muted-foreground text-xs">
            还有更早的提交没有列出，到完整对比里查看
          </li>
        ) : null}
      </ol>
    </div>
  );
}
