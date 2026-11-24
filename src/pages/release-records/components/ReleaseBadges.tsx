import { cn } from "@/lib/utils";

import {
  getReleaseRecordTypeLabel,
  releaseHealthStatusMeta,
  releaseRecordStatusClass,
  releaseRecordStatusLabels,
} from "../constants";
import type { ReleasePointerRecord, ReleaseRecordStatus } from "../types";

export function ReleaseStatusBadge({ status }: { status: ReleaseRecordStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-md px-2 font-medium text-xs leading-none",
        releaseRecordStatusClass[status],
      )}
    >
      <i className="size-1.5 rounded-full bg-current" />
      {releaseRecordStatusLabels[status]}
    </span>
  );
}

/** 健康判定结果，status 为空（没有判定过）时不渲染。 */
export function ReleaseHealthBadge({ status }: { status: ReleasePointerRecord["healthStatus"] }) {
  if (!status) {
    return null;
  }
  const meta = releaseHealthStatusMeta[status];
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 font-medium text-xs leading-none",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

export function ReleaseTypeBadge({
  release,
}: {
  release: Pick<ReleasePointerRecord, "grayPercentage" | "grayStrategy" | "releaseType">;
}) {
  const tone =
    release.releaseType !== "gray"
      ? "bg-primary-soft text-primary-text"
      : release.grayStrategy === "targeted"
        ? "bg-muted text-muted-foreground"
        : "bg-route-percentage-soft text-route-percentage";

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md px-2 font-medium text-xs leading-none",
        tone,
      )}
    >
      {getReleaseRecordTypeLabel(release)}
    </span>
  );
}
