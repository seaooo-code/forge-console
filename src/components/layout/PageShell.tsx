import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Page-level shell. Owns background, max-width and outer padding. The inner
 * sections (Header / Body / Aside) keep markup shallow so call sites stay
 * explicit about what kind of content they render.
 */
function PageShellRoot({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("bg-background text-foreground", className)}>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-6 lg:px-8 lg:py-8">
        {children}
      </div>
    </div>
  );
}

function Header({ className, children }: { className?: string; children: ReactNode }) {
  return <header className={cn("min-w-0", className)}>{children}</header>;
}

function Body({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("min-w-0 flex-1 space-y-6", className)}>{children}</div>;
}

function Aside({ className, children }: { className?: string; children: ReactNode }) {
  return <aside className={cn("flex flex-col gap-6", className)}>{children}</aside>;
}

export const PageShell = Object.assign(PageShellRoot, {
  Header,
  Body,
  Aside,
});
