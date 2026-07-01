import type * as React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type MockSurfaceProps<T extends "div" | "section" = "div"> = {
  as?: T;
} & React.ComponentPropsWithoutRef<T>;

export function MockSurface<T extends "div" | "section" = "div">({
  as,
  children,
  className,
  ...props
}: MockSurfaceProps<T>) {
  const Component = as ?? "div";

  return (
    <Component className={cn("relative overflow-hidden", className)} data-mock-surface {...props}>
      {children}
      <MockOverlay />
    </Component>
  );
}

export function MockCard({ children, className, ...props }: React.ComponentProps<typeof Card>) {
  return (
    <Card className={cn("relative overflow-hidden", className)} data-mock-surface {...props}>
      {children}
      <MockOverlay />
    </Card>
  );
}

function MockOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] bg-background/25">
      <span className="absolute top-2 right-2 rounded border border-info/30 bg-card/85 px-2 py-0.5 font-mono font-semibold text-[10px] text-info uppercase tracking-wide shadow-sm">
        mock
      </span>
    </div>
  );
}
