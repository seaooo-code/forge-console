import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 列表页头部：标题、标题下的一行摘要（通常是 SummaryStats），右侧主操作。 */
export function ListHeader({
  actions,
  className,
  summary,
  title,
}: {
  actions?: ReactNode;
  className?: string;
  summary?: ReactNode;
  title: ReactNode;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        <h1 className="m-0 font-semibold text-2xl text-foreground tracking-tight">{title}</h1>
        {summary ? <div className="mt-2">{summary}</div> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}
