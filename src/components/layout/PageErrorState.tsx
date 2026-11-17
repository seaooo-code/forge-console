import { CircleAlert, KeyRound, RotateCw, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageErrorStateProps = {
  title?: string;
  message?: ReactNode;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

type ErrorKind = "network" | "auth" | "unknown";

function classifyError(error: unknown): ErrorKind {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("network") || msg.includes("fetch") || msg.includes("timeout")) {
      return "network";
    }
    if (msg.includes("auth") || msg.includes("401") || msg.includes("403")) {
      return "auth";
    }
  }
  return "unknown";
}

/**
 * Full-area error block used by every page when its top-level query fails.
 * Includes a light classification (network / auth / unknown) so the recovery
 * action can be specific.
 */
export function PageErrorState({
  title,
  message,
  onRetry,
  retryLabel = "重试",
  className,
}: PageErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl bg-destructive-soft px-6 py-12 text-center",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-card text-destructive shadow-edge">
        <TriangleAlert className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold text-destructive text-sm">{title ?? "加载失败"}</p>
        {message ? <p className="text-muted-foreground text-sm">{message}</p> : null}
      </div>
      {onRetry ? (
        <Button variant="outline" type="button" onClick={onRetry}>
          <RotateCw className="size-4" />
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

type ErrorMessageProps = {
  error: unknown;
  onRetry?: () => void;
  className?: string;
};

const kindHint: Record<ErrorKind, { Icon: typeof CircleAlert; title: string; retry?: string }> = {
  auth: { Icon: KeyRound, retry: "重新登录", title: "会话已失效" },
  network: { Icon: CircleAlert, retry: "重试", title: "网络连接失败" },
  unknown: { Icon: TriangleAlert, retry: "重试", title: "加载失败" },
};

/** Smaller, page-internal error block with built-in error classification. */
export function ErrorMessage({ error, onRetry, className }: ErrorMessageProps) {
  const kind = classifyError(error);
  const hint = kindHint[kind];
  const Icon = hint.Icon;
  const message = error instanceof Error ? error.message : "请稍后重试。";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg bg-destructive-soft px-4 py-3 text-destructive",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm">{hint.title}</p>
        <p className="mt-0.5 text-destructive/80 text-xs">{message}</p>
      </div>
      {onRetry && hint.retry ? (
        <Button variant="outline" size="sm" type="button" className="shrink-0" onClick={onRetry}>
          <RotateCw className="size-3.5" />
          {hint.retry}
        </Button>
      ) : null}
    </div>
  );
}
