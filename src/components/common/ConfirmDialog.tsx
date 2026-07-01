import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Modal, ModalFooter, ModalHeader } from "./Modal";

type ConfirmDialogProps = {
  cancelLabel?: string;
  children?: ReactNode;
  confirmLabel: string;
  description: string;
  isConfirmDisabled?: boolean;
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
  isConfirmDisabled = false,
  isOpen,
  isPending = false,
  onCancel,
  onConfirm,
  tone = "default",
  title,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={isPending ? undefined : onCancel}
      labelledBy="confirm-dialog-title"
      describedBy="confirm-dialog-description"
    >
      <ModalHeader
        title={title}
        description={description}
        titleId="confirm-dialog-title"
        descriptionId="confirm-dialog-description"
      >
        {children}
      </ModalHeader>

      <ModalFooter>
        <Button variant="outline" type="button" disabled={isPending} onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={tone === "danger" ? "destructive" : "default"}
          disabled={isPending || isConfirmDisabled}
          className={cn(tone === "danger" && "focus-visible:ring-destructive/40")}
          onClick={onConfirm}
        >
          {isPending ? "处理中" : confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
