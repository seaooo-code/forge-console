import { ExternalLink, GitCommitHorizontal, UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { buildPlatformLabels } from "../constants";
import type { BuildPlatform, BuildRunRecord } from "../types";

/** 短 SHA；有仓库地址时链接到托管平台的提交页。点击不会触发表格行跳转。 */
export function BuildCommitLink({
  build,
}: {
  build: Pick<BuildRunRecord, "commitSha" | "commitShortSha" | "commitUrl">;
}) {
  if (!build.commitSha) {
    return <span className="text-muted-foreground text-xs">commit 未记录</span>;
  }

  if (!build.commitUrl) {
    return (
      <span
        className="inline-flex min-w-0 items-center gap-1 font-mono text-muted-foreground text-xs"
        title={build.commitSha}
      >
        <GitCommitHorizontal className="size-3.5 shrink-0" />
        {build.commitShortSha}
      </span>
    );
  }

  return (
    <a
      href={build.commitUrl}
      target="_blank"
      rel="noreferrer"
      title={build.commitSha}
      data-build-row-action="true"
      className="inline-flex min-w-0 items-center gap-1 font-mono text-primary text-xs hover:underline"
      onClick={(event) => event.stopPropagation()}
    >
      <GitCommitHorizontal className="size-3.5 shrink-0" />
      {build.commitShortSha}
      <ExternalLink className="size-3 shrink-0" />
    </a>
  );
}

export function BuildPlatformBadges({ platforms }: { platforms: string[] }) {
  if (platforms.length === 0) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-1">
      {platforms.map((platform) => (
        <Badge key={platform} variant="neutral" size="sm" className="font-medium">
          {buildPlatformLabels[platform as BuildPlatform] ?? platform}
        </Badge>
      ))}
    </div>
  );
}

export function BuildCreator({ createdBy }: Pick<BuildRunRecord, "createdBy">) {
  if (!createdBy) {
    return <span className="text-muted-foreground text-xs">-</span>;
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5" title={createdBy.id}>
      {createdBy.avatarUrl ? (
        <img
          src={createdBy.avatarUrl}
          alt=""
          className="size-5 shrink-0 rounded-full border border-border object-cover"
        />
      ) : (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
          <UserRound className="size-3" />
        </span>
      )}
      <span className="truncate font-medium text-foreground text-xs">{createdBy.name}</span>
    </span>
  );
}
