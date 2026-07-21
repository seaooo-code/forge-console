import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Alert } from "@/components/ui/alert";

import type { ApplicationStatusCode, HostApplication } from "../types";

type ApplicationStatusDialogProps = {
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  statusActionError: string;
  target: HostApplication | null;
};

export function ApplicationStatusDialog({
  isPending,
  onCancel,
  onConfirm,
  statusActionError,
  target,
}: ApplicationStatusDialogProps) {
  const statusActionLabel = target?.status === "已下线" ? "上线" : "下线";
  const nextStatus: ApplicationStatusCode = target?.status === "已下线" ? "running" : "offline";

  return (
    <ConfirmDialog
      isOpen={target !== null}
      isPending={isPending}
      title={`${statusActionLabel}应用`}
      description={
        target
          ? `确认${statusActionLabel}「${target.name}」？应用状态将更新为${nextStatus === "running" ? "运行中" : "已下线"}。`
          : ""
      }
      confirmLabel={`${statusActionLabel}应用`}
      tone={nextStatus === "offline" ? "danger" : "default"}
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {statusActionError ? <Alert variant="danger">{statusActionError}</Alert> : null}
    </ConfirmDialog>
  );
}
