import { ConfirmDialog } from "@/components/common/ConfirmDialog";

import type { TestPlanMemberConflict } from "../api";

type TestPlanConflictDialogProps = {
  conflicts: TestPlanMemberConflict[] | null;
  isPending: boolean;
  moduleNames: Record<string, string>;
  onCancel: () => void;
  onConfirm: () => void;
};

/** 成员冲突确认：同一 userId 在同一模块上只能属于一张进行中的提测单，确认后从对方提测单移出。 */
export function TestPlanConflictDialog({
  conflicts,
  isPending,
  moduleNames,
  onCancel,
  onConfirm,
}: TestPlanConflictDialogProps) {
  return (
    <ConfirmDialog
      confirmLabel="移出并继续"
      description="同一个账号在同一个模块上只能属于一张进行中的提测单。确认后，这些账号会从下面的提测单中移出，对方提测单的条目和其他成员不受影响。"
      isOpen={Boolean(conflicts)}
      isPending={isPending}
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="部分账号正在其他提测单里测试"
    >
      <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
        {(conflicts ?? []).map((conflict) => (
          <li
            key={`${conflict.userId}-${conflict.testPlan.id}`}
            className="rounded-lg bg-muted px-3 py-2 text-sm"
          >
            <span className="font-mono">{conflict.userId}</span>
            <span className="text-muted-foreground"> 将从 </span>
            <span className="font-medium">「{conflict.testPlan.name}」</span>
            <span className="text-muted-foreground"> 移出，重叠模块：</span>
            {conflict.moduleIds.map((id) => moduleNames[id] ?? id).join("、")}
          </li>
        ))}
      </ul>
    </ConfirmDialog>
  );
}
