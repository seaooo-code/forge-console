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
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  rose: "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300",
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
        "inline-flex h-6 items-center rounded-md px-2 font-medium text-xs leading-none",
        environment ? environmentToneClass[resolvedTone] : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {children ?? environment}
    </span>
  );
}
