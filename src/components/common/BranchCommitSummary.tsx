import { skipToken, useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNowStrict } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ExternalLink, GitCommitHorizontal, LoaderCircle } from "lucide-react";

import {
  fetchModuleBranchCommit,
  ModulesAPIError,
  moduleBranchCommitQueryKey,
} from "@/api/modules";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

/**
 * 新增构建时展示所选分支当前最新的提交，帮助确认要构建的代码。
 * 分支名输入停顿后再查询；这里展示的是打开弹窗时的最新提交，构建实际使用触发时分支上的最新提交。
 */
export function BranchCommitSummary({ branch, moduleId }: { branch: string; moduleId: string }) {
  const debouncedBranch = useDebouncedValue(branch.trim(), 400);
  const shouldFetch = moduleId !== "" && debouncedBranch !== "";
  const {
    data: commit,
    error,
    isFetching,
  } = useQuery({
    queryFn: shouldFetch ? () => fetchModuleBranchCommit(moduleId, debouncedBranch) : skipToken,
    queryKey: moduleBranchCommitQueryKey(moduleId, debouncedBranch),
    retry: false,
    staleTime: 30_000,
  });

  if (!shouldFetch) {
    return null;
  }
  if (isFetching && !commit) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <LoaderCircle className="size-3.5 animate-spin" />
        正在读取分支最新提交
      </div>
    );
  }
  if (error) {
    const missing = error instanceof ModulesAPIError && error.status === 404;
    return (
      <div className={missing ? "text-warning text-xs" : "text-destructive text-xs"}>
        {missing
          ? `仓库里没有分支「${debouncedBranch}」，确认分支名后再构建`
          : `读取最新提交失败：${error.message}`}
      </div>
    );
  }
  if (!commit) {
    return null;
  }

  const committedAt = commit.committedAt ? new Date(commit.committedAt) : null;
  const hasTime = committedAt !== null && !Number.isNaN(committedAt.getTime());
  const shortSha = commit.sha.slice(0, 8);

  return (
    <div className="flex items-start gap-2.5 rounded-lg border bg-muted/40 px-3 py-2.5">
      <GitCommitHorizontal className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0 break-words font-medium text-foreground text-sm">
            {commit.title || "（无提交说明）"}
          </span>
          {commit.webUrl ? (
            <a
              href={commit.webUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1 font-mono text-info text-xs hover:underline"
              title={commit.sha}
            >
              {shortSha}
              <ExternalLink className="size-3" />
            </a>
          ) : (
            <span className="shrink-0 font-mono text-muted-foreground text-xs" title={commit.sha}>
              {shortSha}
            </span>
          )}
        </div>
        <div className="text-muted-foreground text-xs">
          {commit.authorName || "未知作者"}
          {hasTime ? (
            <span title={format(committedAt, "yyyy-MM-dd HH:mm:ss")}>
              {" · "}
              {formatDistanceToNowStrict(committedAt, { addSuffix: true, locale: zhCN })}提交
            </span>
          ) : null}
          {isFetching ? <span> · 刷新中</span> : null}
        </div>
      </div>
    </div>
  );
}
