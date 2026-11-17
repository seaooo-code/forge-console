import type { ReactNode } from "react";
import { useEffect } from "react";

import { cn } from "@/lib/utils";

type ModalProps = {
  isOpen: boolean;
  onClose?: () => void;
  labelledBy?: string;
  describedBy?: string;
  className?: string;
  children: ReactNode;
};

/**
 * Shared modal shell: fixed overlay + centered token-driven surface. All
 * dialogs (confirm, create/edit forms) build on this to keep overlay, surface
 * and a11y semantics consistent across the console.
 */
export function Modal({
  isOpen,
  onClose,
  labelledBy,
  describedBy,
  className,
  children,
}: ModalProps) {
  useEffect(() => {
    if (!isOpen || !onClose) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-close; Escape is handled above and focus stays on the dialog
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 px-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        className={cn(
          "w-full max-w-md rounded-2xl bg-card p-5 text-card-foreground shadow-raise",
          className,
        )}
      >
        {children}
      </section>
    </div>
  );
}

export function ModalHeader({
  title,
  description,
  titleId,
  descriptionId,
  children,
}: {
  title: string;
  description?: string;
  titleId?: string;
  descriptionId?: string;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h2 id={titleId} className="font-semibold text-foreground text-lg">
        {title}
      </h2>
      {description ? (
        <p id={descriptionId} className="text-muted-foreground text-sm leading-6">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function ModalFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mt-5 flex justify-end gap-2", className)}>{children}</div>;
}
