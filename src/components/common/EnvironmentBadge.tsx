import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EnvironmentBadgeProps = {
  children?: ReactNode;
  className?: string;
  environment: string;
};

export const miCarEnvironmentBadgeClass: Record<string, string> = {
  dev: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-300",
  preProduct:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300",
  preview:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300",
  product:
    "border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300",
  staging:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300",
};

export function EnvironmentBadge({ children, className, environment }: EnvironmentBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        miCarEnvironmentBadgeClass[environment] ?? "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {children ?? environment}
    </span>
  );
}
