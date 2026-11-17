import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DrawerProps = {
  isOpen: boolean;
  onClose?: () => void;
  labelledBy?: string;
  describedBy?: string;
  className?: string;
  children: ReactNode;
};

/**
 * 右侧抽屉：字段少的新建、编辑、发布表单统一放这里，页面内容保持可见。
 * 结构固定为 DrawerHeader / DrawerBody / DrawerFooter，表单把三者包在 form 里即可。
 */
export function Drawer({
  isOpen,
  onClose,
  labelledBy,
  describedBy,
  className,
  children,
}: DrawerProps) {
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
    // biome-ignore lint/a11y/noStaticElementInteractions: 点遮罩关闭；Esc 在上面处理
    <div
      className="fixed inset-0 z-50 flex justify-end bg-foreground/30 p-2 backdrop-blur-xs"
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
          "fade-in-0 slide-in-from-right-8 flex w-full max-w-md animate-in flex-col overflow-hidden rounded-2xl bg-card text-card-foreground shadow-raise duration-200",
          className,
        )}
      >
        {children}
      </section>
    </div>
  );
}

export function DrawerHeader({
  title,
  description,
  titleId,
  descriptionId,
  onClose,
  children,
}: {
  title: string;
  description?: ReactNode;
  titleId?: string;
  descriptionId?: string;
  onClose?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-start gap-3 px-6 pt-5 pb-4">
      <div className="min-w-0 flex-1 space-y-1.5">
        <h2 id={titleId} className="m-0 font-semibold text-foreground text-lg tracking-tight">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="m-0 text-muted-foreground text-sm leading-6">
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {onClose ? (
        <Button
          aria-label="关闭"
          className="-mr-2 shrink-0 text-muted-foreground"
          onClick={onClose}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      ) : null}
    </div>
  );
}

export function DrawerBody({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 pb-6", className)}>{children}</div>
  );
}

export function DrawerFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex shrink-0 justify-end gap-2 bg-card px-6 pt-3 pb-5", className)}>
      {children}
    </div>
  );
}
