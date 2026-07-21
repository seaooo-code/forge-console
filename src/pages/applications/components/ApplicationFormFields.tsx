import { Checkbox } from "@/components/ui/checkbox";

import type { CheckOptionProps, FieldProps } from "../types";

export function Field({ children, className, label }: FieldProps) {
  return (
    <div className={className}>
      <div className="mb-1.5 font-medium text-foreground text-sm">{label}</div>
      {children}
    </div>
  );
}

export function CheckOption({ checked, label, onCheckedChange }: CheckOptionProps) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-foreground text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange?.(value === true)} />
      <span>{label}</span>
    </div>
  );
}
