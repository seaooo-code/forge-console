import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionCardProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Optional accent (e.g. status chip rendered next to the title). */
  badge?: ReactNode;
  className?: string;
  /** Padding override. Default: `p-5 lg:p-6`. */
  padding?: "none" | "sm" | "md" | "lg";
  children?: ReactNode;
};

const paddingClass = {
  none: "",
  sm: "px-4 py-4",
  md: "px-5 py-5",
  lg: "px-6 py-6",
};

const paddingHeaderClass = {
  none: "",
  sm: "px-4 pt-4 pb-3",
  md: "px-5 pt-5 pb-3",
  lg: "px-6 pt-6 pb-4",
};

const paddingBodyClass = {
  none: "",
  sm: "px-4 pb-4",
  md: "px-5 pb-5",
  lg: "px-6 pb-6",
};

/**
 * Titled card used to group a section of a detail or form page. Replaces ad-hoc
 * `Card` + heading/title paragraphs that previously piled up on detail pages.
 */
export function SectionCard({
  title,
  description,
  actions,
  badge,
  className,
  padding = "md",
  children,
}: SectionCardProps) {
  const hasHeader = Boolean(title) || Boolean(actions) || Boolean(badge);

  return (
    <section
      className={cn(
        "rounded-xl bg-card shadow-edge",
        !hasHeader && paddingClass[padding],
        className,
      )}
    >
      {hasHeader ? (
        <header
          className={cn(
            "flex flex-wrap items-start justify-between gap-3",
            paddingHeaderClass[padding],
          )}
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {title ? (
                <h2 className="font-semibold text-base text-foreground leading-none">{title}</h2>
              ) : null}
              {badge}
            </div>
            {description ? (
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      {children ? <div className={paddingBodyClass[padding]}>{children}</div> : null}
    </section>
  );
}
