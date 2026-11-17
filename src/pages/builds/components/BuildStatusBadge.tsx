import { cn } from "@/lib/utils";

import { buildStatusClass, buildStatusLabels } from "../constants";
import type { BuildRunStatus } from "../types";

export function BuildStatusBadge({
  status,
  className,
}: {
  status: BuildRunStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md px-2 font-medium text-xs leading-none",
        buildStatusClass[status],
        className,
      )}
    >
      <i
        className={cn(
          "size-1.5 rounded-full bg-current",
          (status === "running" || status === "queued") && "animate-pulse",
        )}
      />
      {buildStatusLabels[status]}
    </span>
  );
}
