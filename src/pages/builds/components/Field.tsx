import type { ReactNode } from "react";

export function Field({
  children,
  inputId,
  label,
}: {
  children: ReactNode;
  inputId: string;
  label: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="font-medium text-muted-foreground text-xs">
        {label}
      </label>
      {children}
    </div>
  );
}
