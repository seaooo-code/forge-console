import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva("flex items-start gap-2 rounded-md border px-3 py-2 text-sm", {
  variants: {
    variant: {
      default: "border-border bg-muted text-foreground",
      info: "border-info/30 bg-info/10 text-info",
      success: "border-success/30 bg-success/10 text-success",
      warning: "border-warning/40 bg-warning/10 text-warning",
      danger: "border-destructive/30 bg-destructive/10 text-destructive",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const variantIcons: Record<
  NonNullable<VariantProps<typeof alertVariants>["variant"]>,
  LucideIcon
> = {
  default: Info,
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
};

type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    icon?: boolean;
  };

/**
 * Inline status message used across the console for success / warning / danger /
 * info feedback. Colors are driven by semantic tokens so it follows light/dark.
 */
function Alert({ className, variant, icon = true, children, ...props }: AlertProps) {
  const Icon = variantIcons[variant ?? "default"];

  return (
    <div role="status" className={cn(alertVariants({ variant }), className)} {...props}>
      {icon ? <Icon className="mt-0.5 size-4 shrink-0" /> : null}
      <div className="min-w-0 flex-1 leading-6">{children}</div>
    </div>
  );
}

export { Alert, alertVariants };
