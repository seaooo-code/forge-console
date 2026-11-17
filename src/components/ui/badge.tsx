import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring/40",
  {
    variants: {
      variant: {
        default: "bg-primary px-2 py-0.5 text-primary-foreground text-xs",
        secondary: "bg-secondary px-2 py-0.5 text-secondary-foreground text-xs",
        destructive:
          "bg-destructive px-2 py-0.5 text-white text-xs focus-visible:ring-destructive/30",
        outline: "bg-card px-2 py-0.5 text-foreground text-xs shadow-edge",
        success: "bg-success/12 px-2 py-0.5 text-success text-xs",
        warning: "bg-warning/14 px-2 py-0.5 text-warning text-xs",
        info: "bg-info-soft px-2 py-0.5 text-info text-xs",
        neutral: "bg-muted px-2 py-0.5 text-muted-foreground text-xs",
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
