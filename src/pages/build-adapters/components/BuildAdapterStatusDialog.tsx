import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Alert } from "@/components/ui/alert";

import type { BuildAdapter } from "../types";

type BuildAdapterStatusDialogProps = {
  adapter: BuildAdapter | null;
  error: string;
  isPending: boolean;
  onCancel: () => void;
  onConfirm: (adapter: BuildAdapter) => void;
};

/** 停用 / 启用确认：停用时提示引用它的模块将无法发起新构建。 */
export function BuildAdapterStatusDialog({
  adapter,
  error,
  isPending,
  onCancel,
  onConfirm,
}: BuildAdapterStatusDialogProps) {
  const isDisabling = adapter?.status === "active";

  return (
    <ConfirmDialog
      isOpen={adapter !== null}
      isPending={isPending}
      title={isDisabling ? "停用构建适配器" : "启用构建适配器"}
      description={
        adapter
          ? isDisabling
            ? `确认停用「${adapter.name}」？引用它的 ${adapter.moduleCount} 个模块将无法发起新构建，已有的构建和发布不受影响。停用后也不能再被新模块选择。`
            : `确认启用「${adapter.name}」？启用后引用它的模块可以重新发起构建，新模块也可以选择它。`
          : ""
      }
      confirmLabel={isDisabling ? "停用" : "启用"}
      tone={isDisabling ? "danger" : "default"}
      onCancel={onCancel}
      onConfirm={() => {
        if (adapter) {
          onConfirm(adapter);
        }
      }}
    >
      {error ? (
        <Alert variant="danger" className="px-3 py-2">
          {error}
        </Alert>
      ) : null}
    </ConfirmDialog>
  );
}
