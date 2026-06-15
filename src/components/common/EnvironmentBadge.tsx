import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type EnvironmentBadgeProps = {
  children?: ReactNode;
  className?: string;
  environment: string;
};

export const miCarEnvironmentBadgeClass: Record<string, string> = {
  dev: "border-sky-200 bg-sky-50 text-sky-700",
  preProduct: "border-emerald-200 bg-emerald-50 text-emerald-700",
  preview: "border-amber-200 bg-amber-50 text-amber-700",
  product: "border-red-200 bg-red-50 text-red-600",
  staging: "border-blue-200 bg-blue-50 text-blue-700",
};

export function EnvironmentBadge({ children, className, environment }: EnvironmentBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        miCarEnvironmentBadgeClass[environment] ?? "border-slate-200 bg-slate-50 text-slate-600",
        className,
      )}
    >
      {children ?? environment}
    </span>
  );
}
