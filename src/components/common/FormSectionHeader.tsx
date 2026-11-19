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
    // min-w-0：放在网格列里时不被内容撑宽，长选项和长文本在列内截断，不会盖住相邻字段。
    <div className="flex min-w-0 flex-col gap-2">
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
    <div className="px-5 pt-5 pb-1">
      <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      <p className="mt-1 text-muted-foreground text-xs">{description}</p>
    </div>
  );
}
