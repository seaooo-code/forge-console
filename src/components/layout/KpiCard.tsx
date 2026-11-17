import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type KpiTone = "primary" | "info" | "success" | "warning" | "destructive" | "muted";

const toneClass: Record<KpiTone, string> = {
  primary: "bg-primary/10 text-primary",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive-soft text-destructive",
  muted: "bg-muted text-muted-foreground",
};

type KpiCardProps = {
  icon?: LucideIcon;
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: KpiTone;
  /** Override the icon background tone with a custom class (e.g. when the tone comes from a constants map). */
  toneClassName?: string;
  trend?: ReactNode;
  /** Optional slot for domain-specific content (mini sparkline, bar, breakdown). */
  children?: ReactNode;
  className?: string;
};

/**
 * Top-level KPI tile. Same visual rhythm on every page so users can scan
 * the metric band quickly. Domain richness goes in `children` rather than
 * custom props.
 */
export function KpiCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "primary",
  toneClassName,
  trend,
  children,
  className,
}: KpiCardProps) {
  const iconTone = toneClassName ?? toneClass[tone];

  return (
    <div className={cn("flex flex-col gap-3 rounded-xl bg-card p-4 shadow-edge", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                iconTone,
              )}
            >
              <Icon className="size-4" />
            </span>
          ) : null}
          <span className="truncate font-medium text-muted-foreground text-xs">{label}</span>
        </div>
        {trend ? <div className="shrink-0">{trend}</div> : null}
      </div>

      <div className="font-semibold text-2xl text-foreground leading-none tracking-tight">
        {value}
      </div>

      {detail ? <div className="text-muted-foreground text-xs">{detail}</div> : null}
      {children}
    </div>
  );
}
