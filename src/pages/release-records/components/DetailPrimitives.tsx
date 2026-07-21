import type { LucideIcon } from "lucide-react";
import { Rocket, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  getReleaseRecordTypeLabel,
  releaseRecordStatusClass,
  releaseRecordStatusLabels,
} from "../constants";
import type { ReleaseRecordDetail, ReleaseRecordStatus } from "../types";

export function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex h-12 items-center justify-between border-border border-b px-4">
      <div>
        <div className="font-semibold text-foreground text-sm">{title}</div>
      </div>
    </div>
  );
}

export function DetailItem({
  description,
  icon: Icon,
  label,
  onClick,
  value,
  wide = false,
}: {
  description?: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2 rounded-lg border border-border bg-muted px-3 py-2",
        wide && "md:col-span-2",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">{label}</div>
        {onClick ? (
          <Button
            variant="link"
            type="button"
            className="h-auto min-w-0 justify-start break-all p-0 text-left font-semibold text-primary text-sm"
            onClick={onClick}
          >
            {value || "-"}
          </Button>
        ) : (
          <div className="break-all font-semibold text-foreground text-sm">{value || "-"}</div>
        )}
        {description ? (
          <div className="mt-0.5 break-all text-muted-foreground text-xs">{description}</div>
        ) : null}
      </div>
    </div>
  );
}

export function ReleaseStatusBadge({ status }: { status: ReleaseRecordStatus }) {
  const Icon = status === "active" ? ShieldCheck : Rocket;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded border px-2 font-semibold text-xs leading-none",
        releaseRecordStatusClass[status],
      )}
    >
      <Icon className="size-3" />
      {releaseRecordStatusLabels[status]}
    </span>
  );
}

export function ReleaseTypeBadge({ release }: { release: ReleaseRecordDetail }) {
  return (
    <Badge variant="outline" className="border-border font-medium text-muted-foreground">
      {getReleaseRecordTypeLabel(release)}
    </Badge>
  );
}
