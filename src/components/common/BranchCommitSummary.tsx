import { skipToken, useQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";

import {
  fetchModuleBranchCommit,
  ModulesAPIError,
  moduleBranchCommitQueryKey,
} from "@/api/modules";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import { CommitCard } from "./CommitInfo";

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

  return (
    <CommitCard
      commit={{
        authorName: commit.authorName,
        committedAt: commit.committedAt,
        sha: commit.sha,
        title: commit.title,
        url: commit.webUrl,
      }}
    />
  );
}
