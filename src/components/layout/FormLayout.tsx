import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FormLayoutProps = {
  cols?: 1 | 2;
  className?: string;
  children: ReactNode;
};

/**
 * Two-column responsive form grid. Pair with `SectionCard` to build a sectioned
 * form. Single column on mobile, two columns from `md` upward.
 */
export function FormLayout({ cols = 2, className, children }: FormLayoutProps) {
  return (
    <div
      className={cn(
        "grid gap-x-6 gap-y-5",
        cols === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

type FormActionsProps = {
  primary?: ReactNode;
  secondary?: ReactNode;
  /** Right-aligned hint (e.g. "未保存的修改将丢失"). */
  hint?: ReactNode;
  className?: string;
};

/**
 * Sticky bottom action bar for form pages. Used at the foot of `FormPageLayout`.
 */
export function FormActions({ primary, secondary, hint, className }: FormActionsProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 mt-6 -mx-6 bg-background/90 px-6 py-3 backdrop-blur lg:-mx-8 lg:px-8",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground text-xs">{hint}</div>
        <div className="flex items-center gap-2">
          {secondary}
          {primary}
        </div>
      </div>
    </div>
  );
}
