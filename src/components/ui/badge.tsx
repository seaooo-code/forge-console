import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary px-2 py-0.5 text-primary-foreground text-xs",
        secondary: "border-transparent bg-secondary px-2 py-0.5 text-secondary-foreground text-xs",
        destructive:
          "border-transparent bg-destructive px-2 py-0.5 text-white text-xs focus-visible:ring-destructive/30",
        outline: "border-border bg-card px-2 py-0.5 text-foreground text-xs",
        success: "border-success/30 bg-success/10 px-2 py-0.5 text-success text-xs",
        warning: "border-warning/40 bg-warning/10 px-2 py-0.5 text-warning text-xs",
        info: "border-info/30 bg-info/10 px-2 py-0.5 text-info text-xs",
        neutral: "border-border bg-muted px-2 py-0.5 text-muted-foreground text-xs",
      },
      size: {
        sm: "px-1.5 py-0 text-[10px]",
        md: "px-2 py-0.5 text-xs",
        lg: "px-2.5 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
