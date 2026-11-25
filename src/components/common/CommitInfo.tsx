import { format, formatDistanceToNowStrict } from "date-fns";
import { zhCN } from "date-fns/locale";
import { ExternalLink, GitCommitHorizontal } from "lucide-react";

import { cn } from "@/lib/utils";
import type { CommitDetail } from "@/types/commits";

function parseCommitTime(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 「作者 · 3 天前」，悬停显示具体时间；作者和时间都没有时返回空字符串。 */
export function commitByline(commit: Pick<CommitDetail, "authorName" | "committedAt">) {
  const date = parseCommitTime(commit.committedAt);
  const relative = date ? formatDistanceToNowStrict(date, { addSuffix: true, locale: zhCN }) : "";
  return [commit.authorName, relative].filter(Boolean).join(" · ");
}

function commitTooltip(commit: CommitDetail) {
  const date = parseCommitTime(commit.committedAt);
  return [
    commit.title,
    [commit.authorName, date ? format(date, "yyyy-MM-dd HH:mm") : ""].filter(Boolean).join(" · "),
    commit.sha,
  ]
    .filter(Boolean)
    .join("\n");
}

/** 短 SHA；有提交页地址时是外链。在表格行里点击不会触发行跳转。 */
export function CommitLink({ commit, className }: { commit: CommitDetail; className?: string }) {
  if (!commit.sha) {
    return <span className="text-muted-foreground text-xs">commit 未记录</span>;
  }
  const shortSha = commit.sha.slice(0, 8);
  if (!commit.url) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1 font-mono text-muted-foreground text-xs",
          className,
        )}
        title={commit.sha}
      >
        <GitCommitHorizontal className="size-3.5 shrink-0" />
        {shortSha}
      </span>
    );
  }
  return (
    <a
      href={commit.url}
      target="_blank"
      rel="noreferrer"
      title={commit.sha}
      data-build-row-action="true"
      className={cn(
        "inline-flex shrink-0 items-center gap-1 font-mono text-primary text-xs hover:underline",
        className,
      )}
      onClick={(event) => event.stopPropagation()}
    >
      <GitCommitHorizontal className="size-3.5 shrink-0" />
      {shortSha}
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}

/** 一行展示：短 SHA + 提交说明（截断），悬停看作者、时间和完整 SHA。用于表格和紧凑列表。 */
export function CommitInline({ commit, className }: { commit: CommitDetail; className?: string }) {
  return (
    <span
      className={cn("inline-flex min-w-0 max-w-full items-center gap-1.5", className)}
      title={commit.sha ? commitTooltip(commit) : undefined}
    >
      <CommitLink commit={commit} />
      {commit.title ? (
        <span className="min-w-0 truncate text-muted-foreground text-xs">{commit.title}</span>
      ) : null}
    </span>
  );
}

/** 卡片展示：提交说明、短 SHA、作者和时间。用于详情和弹窗。 */
export function CommitCard({ commit, className }: { commit: CommitDetail; className?: string }) {
  const byline = commitByline(commit);
  const date = parseCommitTime(commit.committedAt);
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border bg-muted/40 px-3 py-2.5",
        className,
      )}
    >
      <GitCommitHorizontal className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              "min-w-0 break-words text-sm",
              commit.title ? "font-medium text-foreground" : "text-muted-foreground",
            )}
          >
            {commit.title || (commit.sha ? "没有记录提交说明" : "还没有检出代码")}
          </span>
          {commit.sha ? <CommitLink commit={commit} /> : null}
        </div>
        {byline ? (
          <div
            className="text-muted-foreground text-xs"
            title={date ? format(date, "yyyy-MM-dd HH:mm:ss") : undefined}
          >
            {byline}
          </div>
        ) : null}
      </div>
    </div>
  );
}
