import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

/** Centered empty placeholder: icon badge + title + description + optional CTA. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center shadow-none",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-foreground text-sm">{title}</p>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {action}
    </Card>
  );
}

type ErrorStateProps = {
  title?: string;
  message?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

/** Danger-toned error card with an optional retry action. */
export function ErrorState({
  title = "加载失败",
  message = "请稍后重试。",
  onRetry,
  retryLabel = "重试",
  className,
}: ErrorStateProps) {
  return (
    <Card className={cn("bg-destructive-soft p-5 text-destructive shadow-none", className)}>
      <p className="font-medium text-sm">{title}</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry ? (
        <Button variant="outline" type="button" className="mt-3" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </Card>
  );
}

type LoadingSkeletonProps = {
  rows?: number;
  className?: string;
  rowClassName?: string;
};

/** Animated skeleton cards for page/section loading states. */
export function LoadingSkeleton({
  rows = 1,
  className,
  rowClassName = "h-96",
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: rows }).map((_, index) => (
        <Card
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders
          key={index}
          className={cn("animate-pulse bg-card shadow-none", rowClassName)}
        />
      ))}
    </div>
  );
}
