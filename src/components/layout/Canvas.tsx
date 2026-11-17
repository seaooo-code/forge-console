import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 「列表 + 详情面板」页面的两块画布。这类页面在外框里不再被包一层画布
 * （见 ConsoleLayout 的 fullBleedPaths），由页面自己排布。
 */
export function Canvas({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "min-h-0 min-w-0 flex-1 overflow-y-auto rounded-xl bg-background px-6 py-6 shadow-edge lg:px-8 lg:py-7",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function SidePanel({
  className,
  children,
  label,
}: {
  className?: string;
  children: ReactNode;
  label: string;
}) {
  return (
    <aside
      aria-label={label}
      className={cn(
        "min-h-0 w-full shrink-0 overflow-y-auto rounded-xl bg-background shadow-edge xl:w-144",
        className,
      )}
    >
      {children}
    </aside>
  );
}
