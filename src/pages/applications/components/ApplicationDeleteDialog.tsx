import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Alert } from "@/components/ui/alert";

import type { ApplicationDeleteCheck, HostApplication } from "../types";

type ApplicationDeleteDialogProps = {
  deleteCheck: ApplicationDeleteCheck | undefined;
  deleteError: string;
  isCheckingDelete: boolean;
  isDeleteCheckError: boolean;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  target: HostApplication | null;
};

export function ApplicationDeleteDialog({
  deleteCheck,
  deleteError,
  isCheckingDelete,
  isDeleteCheckError,
  isPending,
  onCancel,
  onConfirm,
  target,
}: ApplicationDeleteDialogProps) {
  return (
    <ConfirmDialog
      isOpen={target !== null}
      isPending={isPending}
      isConfirmDisabled={isCheckingDelete || isDeleteCheckError || deleteCheck?.deletable !== true}
      title="删除应用"
      description={
        target ? `确认删除「${target.name}」？删除前会检查依赖，检查通过后将彻底删除。` : ""
      }
      confirmLabel="删除应用"
      tone="danger"
      onCancel={onCancel}
      onConfirm={onConfirm}
    >
      {isCheckingDelete ? <Alert variant="info">正在检查应用依赖</Alert> : null}
      {isDeleteCheckError ? <Alert variant="danger">依赖检查失败，请稍后重试</Alert> : null}
      {deleteCheck?.message ? <Alert variant="default">{deleteCheck.message}</Alert> : null}
      {deleteCheck && deleteCheck.dependencies.length > 0 ? (
        <Alert variant="warning">
          <div className="font-medium">存在依赖，不能删除</div>
          <div className="mt-2 space-y-1">
            {deleteCheck.dependencies.map((dependency) => (
              <div key={dependency.id} className="flex min-w-0 items-start gap-2">
                <span className="shrink-0 rounded bg-warning/20 px-1.5 py-0.5 font-medium text-warning text-xs">
                  {dependency.type}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{dependency.name}</span>
                  {dependency.description ? (
                    <span className="block truncate text-warning/80 text-xs">
                      {dependency.description}
                    </span>
                  ) : null}
                </span>
              </div>
            ))}
          </div>
        </Alert>
      ) : null}
      {deleteCheck?.deletable && deleteCheck.dependencies.length === 0 ? (
        <Alert variant="success">依赖检查通过，确认后将彻底删除。</Alert>
      ) : null}
      {deleteError ? <Alert variant="danger">{deleteError}</Alert> : null}
    </ConfirmDialog>
  );
}
