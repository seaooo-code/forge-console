import type { ReactNode } from "react";

import type { APISchemas } from "@/api/client";
import { cn } from "@/lib/utils";

type EnvironmentTone = APISchemas["Environment"]["tone"];

type EnvironmentBadgeProps = {
  children?: ReactNode;
  className?: string;
  environment: string;
  tone?: EnvironmentTone;
};

const environmentToneClass: Record<EnvironmentTone, string> = {
  amber:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300",
  blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300",
  emerald:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300",
  rose: "border-red-200 bg-red-50 text-red-600 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-300",
  sky: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/50 dark:text-sky-300",
};

const environmentTones = Object.keys(environmentToneClass) as EnvironmentTone[];

export function EnvironmentBadge({
  children,
  className,
  environment,
  tone,
}: EnvironmentBadgeProps) {
  // 调用方没有环境配置的 tone 时，按 code 稳定取色，避免依赖写死的环境列表。
  const resolvedTone =
    tone ??
    environmentTones[
      [...environment].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0) %
        environmentTones.length
    ];

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        environment
          ? environmentToneClass[resolvedTone]
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {children ?? environment}
    </span>
  );
}
