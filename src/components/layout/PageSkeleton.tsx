import { cn } from "@/lib/utils";

type PageSkeletonProps = {
  /** Number of body rows to skeletonize. */
  rows?: number;
  className?: string;
  /** Whether to include a header skeleton band at the top. */
  withHeader?: boolean;
  /** Whether to include a filter-bar skeleton below the header. */
  withFilterBar?: boolean;
  /** When true, renders a grid of KPI card skeletons instead of a single body. */
  withKpis?: boolean;
  kpiCount?: number;
};

const skeletonKeys = ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"] as const;

/**
 * Skeleton placeholders that mirror the page shapes built with the layout
 * primitives. Helps avoid layout shift on first paint and gives the
 * console a unified loading look.
 */
export function PageSkeleton({
  rows = 1,
  className,
  withHeader = true,
  withFilterBar = true,
  withKpis = false,
  kpiCount = 6,
}: PageSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {withHeader ? <HeaderSkeleton /> : null}
      {withFilterBar ? <FilterBarSkeleton /> : null}
      {withKpis ? <KpiRowSkeleton count={kpiCount} /> : null}
      {skeletonKeys.slice(0, rows).map((id) => (
        <div key={id} className="h-72 animate-pulse rounded-xl bg-card shadow-edge" />
      ))}
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-8 w-28 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-7 w-44 animate-pulse rounded bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded bg-muted" />
    </div>
  );
}

function FilterBarSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        {skeletonKeys.slice(0, 3).map((id) => (
          <div key={id} className="h-9 w-28 animate-pulse rounded-md bg-muted" />
        ))}
        <div className="ml-auto h-9 w-44 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

function KpiRowSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {skeletonKeys.slice(0, count).map((id) => (
        <div key={id} className="h-28 animate-pulse rounded-xl bg-card shadow-edge" />
      ))}
    </div>
  );
}
