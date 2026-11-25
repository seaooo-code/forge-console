import { UserRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import { buildPlatformLabels } from "../constants";
import type { BuildPlatform, BuildRunRecord } from "../types";

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
          className="size-5 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UserRound className="size-3" />
        </span>
      )}
      <span className="truncate font-medium text-foreground text-xs">{createdBy.name}</span>
    </span>
  );
}
