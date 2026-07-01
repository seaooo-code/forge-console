import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FieldProps = {
  label: ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Consistent labelled form field used by both dedicated create/edit pages and
 * modal forms: label, control slot, optional hint, and error message — all
 * token-driven so it follows light/dark.
 */
export function Field({ label, htmlFor, required, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 font-medium text-muted-foreground text-xs"
      >
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}
