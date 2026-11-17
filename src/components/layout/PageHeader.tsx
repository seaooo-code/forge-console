import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Crumb = {
  href?: string;
  label: string;
};

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: Crumb[];
  /** Right-side meta info (e.g. "数据更新于 12:34"). Rendered muted-foreground. */
  meta?: ReactNode;
  /** Right-side action buttons, rendered after meta. */
  actions?: ReactNode;
  /** When set, shows a left-aligned back button. */
  onBack?: () => void;
  backLabel?: string;
  /** Slot rendered below the title row but above the description (e.g. status chip). */
  eyebrow?: ReactNode;
  /** Slot rendered after the description (e.g. a row of summary pills). */
  below?: ReactNode;
  className?: string;
};

/**
 * Standard page header. Owns title, description, breadcrumbs, back button and
 * the right-side action/meta cluster. All pages route through this so the
 * first screen of the console has a consistent rhythm.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  meta,
  actions,
  onBack,
  backLabel = "返回",
  eyebrow,
  below,
  className,
}: PageHeaderProps) {
  const hasTopRow = Boolean(breadcrumbs?.length) || Boolean(onBack);
  const hasRightCluster = Boolean(meta) || Boolean(actions);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {(hasTopRow || hasRightCluster) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {hasTopRow ? (
            <div className="flex items-center gap-3 text-muted-foreground text-xs">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="-ml-2 inline-flex h-7 items-center gap-1.5 rounded-md px-2 font-medium text-foreground transition-colors hover:bg-hover"
                >
                  <BackIcon className="size-3.5" />
                  {backLabel}
                </button>
              ) : null}
              {breadcrumbs?.length ? (
                <nav className="flex items-center gap-1.5" aria-label="breadcrumb">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={crumb.label} className="flex items-center gap-1.5">
                      {index > 0 ? <span className="text-muted-foreground/50">/</span> : null}
                      <span
                        className={cn(
                          index === breadcrumbs.length - 1
                            ? "font-medium text-foreground"
                            : "hover:text-foreground",
                        )}
                      >
                        {crumb.label}
                      </span>
                    </span>
                  ))}
                </nav>
              ) : null}
            </div>
          ) : (
            <span />
          )}

          {hasRightCluster ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              {meta ? <div className="text-muted-foreground text-xs">{meta}</div> : null}
              {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            </div>
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {eyebrow}
        <div>
          <h1 className="font-semibold text-2xl text-foreground leading-tight tracking-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-muted-foreground text-sm leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      {below}
    </div>
  );
}

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
