import type { ReactNode } from "react";

type FormSectionFieldProps = {
  children: ReactNode;
  label: ReactNode;
  required?: boolean;
};

/**
 * Labelled form field used by dedicated create/edit pages built from
 * Card + FormSectionHeader sections (e.g. storage, environments).
 */
export function FormSectionField({ children, label, required = false }: FormSectionFieldProps) {
  return (
    <div className="grid gap-2">
      <span className="font-medium text-foreground text-sm">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      {children}
    </div>
  );
}

type FormSectionHeaderProps = {
  description: string;
  title: string;
};

/** Header row for a Card-based form section: title + description. */
export function FormSectionHeader({ description, title }: FormSectionHeaderProps) {
  return (
    <div className="border-border border-b px-5 py-4">
      <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      <p className="mt-1 text-muted-foreground text-xs">{description}</p>
    </div>
  );
}
