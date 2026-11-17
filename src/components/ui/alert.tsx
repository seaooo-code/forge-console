import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva("flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm", {
  variants: {
    variant: {
      default: "bg-card text-foreground shadow-edge",
      info: "bg-info-soft text-info",
      success: "bg-success/12 text-success",
      warning: "bg-warning/14 text-warning-foreground dark:text-warning",
      danger: "bg-destructive-soft text-destructive",
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
