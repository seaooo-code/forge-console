import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  cancelLabel?: string;
  children?: ReactNode;
  confirmLabel: string;
  description: string;
  isOpen: boolean;
  isPending?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  tone?: "danger" | "default";
  title: string;
};

export function ConfirmDialog({
  cancelLabel = "取消",
  children,
  confirmLabel,
  description,
  isOpen,
  isPending = false,
  onCancel,
  onConfirm,
  tone = "default",
  title,
}: ConfirmDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-xs">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="space-y-2">
          <h2 id="confirm-dialog-title" className="font-semibold text-lg text-slate-950">
            {title}
          </h2>
          <p id="confirm-dialog-description" className="text-slate-600 text-sm leading-6">
            {description}
          </p>
          {children}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" type="button" disabled={isPending} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={isPending}
            className={cn(
              tone === "danger"
                ? "bg-rose-600 text-white hover:bg-rose-700"
                : "bg-blue-600 text-white hover:bg-blue-700",
            )}
            onClick={onConfirm}
          >
            {isPending ? "处理中" : confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
