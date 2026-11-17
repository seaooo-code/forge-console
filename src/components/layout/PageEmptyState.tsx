import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageEmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/**
 * Empty state for a whole page. Used when no data exists yet for the current
 * filters / page. Pair with `PageErrorState` / `PageSkeleton`.
 */
export function PageEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: PageEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl bg-card px-6 py-16 text-center shadow-edge",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-6" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-foreground text-sm">{title}</p>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Convenience: convert an action handler into a primary button node. */
export function pageEmptyAction(label: string, onClick: () => void) {
  return (
    <Button type="button" className="bg-primary hover:bg-primary/90" onClick={onClick}>
      {label}
    </Button>
  );
}
