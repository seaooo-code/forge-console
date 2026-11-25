import { GitBranch } from "lucide-react";

import type { CommitDetail } from "@/types/commits";

import { CommitComparison } from "./CommitComparison";
import { CommitInline } from "./CommitInfo";

export type OnlineReleaseCommit = {
  /** 线上构建的分支，构建被删除时为空字符串。 */
  branch: string;
  buildId: string;
  /** 线上构建的构建号，构建被删除时为 0。 */
  buildNumber: number;
  commit: CommitDetail;
};

/**
 * 发布前和构建详情里展示「和线上全量差了哪些提交」。online 为空表示这个环境、渠道、运行时版本还没有全量发布。
 */
export function ReleaseCommitDiff({
  branch,
  buildId,
  commitSha,
  moduleId,
  online,
  onlineLabel = "线上全量",
  targetLabel = "这个构建",
}: {
  /** 这个构建的分支。 */
  branch: string;
  buildId: string;
  commitSha: string;
  moduleId: string;
  online: OnlineReleaseCommit | undefined;
  onlineLabel?: string;
  targetLabel?: string;
}) {
  if (!online) {
    return (
      <p className="m-0 text-muted-foreground text-xs">
        这个环境在该运行时版本下还没有{onlineLabel}，发布后这里的提交都是新上线的。
      </p>
    );
  }
  if (online.buildId === buildId) {
    return (
      <p className="m-0 text-muted-foreground text-xs">
        {targetLabel}就是当前的{onlineLabel}。
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex min-w-0 items-center gap-2 text-xs">
        <span className="shrink-0 text-muted-foreground">
          {onlineLabel}
          {online.buildNumber ? ` #${online.buildNumber}` : ""}
        </span>
        {online.branch ? (
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-muted-foreground">
            <GitBranch className="size-3.5" />
            {online.branch}
          </span>
        ) : null}
        <CommitInline commit={online.commit} />
      </div>
      {online.branch && branch && online.branch !== branch ? (
        <p className="m-0 text-warning text-xs">
          {onlineLabel}来自 {online.branch}，{targetLabel}来自 {branch}，两边不是同一个分支。
        </p>
      ) : null}
      {online.commit.sha && commitSha ? (
        <CommitComparison
          from={online.commit.sha}
          fromLabel={onlineLabel}
          moduleId={moduleId}
          to={commitSha}
          toLabel={targetLabel}
        />
      ) : (
        <p className="m-0 text-muted-foreground text-xs">缺少 commit，无法比较提交差异。</p>
      )}
    </div>
  );
}
