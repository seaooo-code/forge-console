import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FilterBarProps = {
  /** Optional "筛选" small label shown above the primary row. */
  label?: ReactNode;
  /** Top row: primary filters. Keep ≤ 3 visible. */
  primary?: ReactNode;
  /** Search input — rendered last in the primary row. */
  search?: ReactNode;
  /** Right-side action cluster (refresh, create, export). */
  actions?: ReactNode;
  /** Second row: advanced/secondary filters. */
  secondary?: ReactNode;
  className?: string;
};

/**
 * Filter + action bar used by every list page. Two rows so the primary
 * controls stay uncluttered while still leaving room for advanced filtering.
 */
export function FilterBar({
  label,
  primary,
  search,
  actions,
  secondary,
  className,
}: FilterBarProps) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex flex-wrap items-center gap-2.5">
        {label ? (
          <span className="mr-1 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {label}
          </span>
        ) : null}
        {primary}
        <div className="ml-auto flex items-center gap-2">
          {search}
          {actions}
        </div>
      </div>

      {secondary ? <div className="flex flex-wrap items-center gap-2.5">{secondary}</div> : null}
    </div>
  );
}
