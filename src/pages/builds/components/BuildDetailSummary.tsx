import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ExternalLink, PackageCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { buildStatusClass, buildStatusLabels } from "../constants";
import type { BuildRunStatus } from "../types";

export function SummaryCard({
  description,
  icon: Icon,
  label,
  value,
}: {
  description: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <Card className="rounded-lg px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="font-medium text-muted-foreground text-sm">{label}</div>
          <div className="mt-2 truncate font-semibold text-foreground text-xl">{value}</div>
          <div className="mt-1 truncate text-muted-foreground text-xs">{description}</div>
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </div>
    </Card>
  );
}

export function SectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex h-12 items-center justify-between border-border border-b px-4">
      <div>
        <div className="font-semibold text-foreground text-sm">{title}</div>
        <div className="text-muted-foreground text-xs">{description}</div>
      </div>
    </div>
  );
}

export function DetailItem({
  children,
  description,
  href,
  icon: Icon,
  label,
  onClick,
  value,
  wide = false,
}: {
  /** 需要展示非纯文本内容（如标签组）时传入，优先于 value。 */
  children?: ReactNode;
  description?: string;
  /** 外部链接地址，在新窗口打开。 */
  href?: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2 rounded-lg border border-border bg-muted px-3 py-2",
        wide && "md:col-span-2",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">{label}</div>
        {children ? (
          <div className="mt-0.5">{children}</div>
        ) : href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 break-all font-semibold text-primary text-sm hover:underline"
          >
            {value || "-"}
            <ExternalLink className="size-3.5 shrink-0" />
          </a>
        ) : onClick ? (
          <Button
            variant="link"
            type="button"
            className="h-auto min-w-0 justify-start break-all p-0 text-left font-semibold text-primary text-sm"
            onClick={onClick}
          >
            {value || "-"}
          </Button>
        ) : (
          <div className="break-all font-semibold text-foreground text-sm">{value || "-"}</div>
        )}
        {description ? (
          <div className="mt-0.5 break-all text-muted-foreground text-xs">{description}</div>
        ) : null}
      </div>
    </div>
  );
}

export function BuildStatusBadge({ status }: { status: BuildRunStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        buildStatusClass[status],
      )}
    >
      {buildStatusLabels[status]}
    </span>
  );
}

export function BuildDetailFallback({
  error,
  isFetching,
  onBack,
}: {
  error: Error | null;
  isFetching: boolean;
  onBack: () => void;
}) {
  return (
    <>
      <div className="border-border border-b bg-card px-6 py-5">
        <Button
          variant="ghost"
          type="button"
          className="-ml-2 h-8 gap-2 px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          返回构建管理
        </Button>
      </div>
      <div className="px-6 py-5">
        <Card className="rounded-lg p-8 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <PackageCheck className="size-5" />
          </div>
          <div className="mt-3 font-semibold text-foreground">
            {isFetching ? "正在加载构建详情" : "未找到构建记录"}
          </div>
          <div className="mt-2 text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "构建记录可能已被删除或当前账号无权限访问。"}
          </div>
        </Card>
      </div>
    </>
  );
}
