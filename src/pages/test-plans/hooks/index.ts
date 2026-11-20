import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  TestPlanAPIError,
  type TestPlanDetail,
  type TestPlanMemberConflict,
  type TestPlanMutationResult,
  testPlanDetailQueryKey,
  testPlansRootQueryKey,
} from "../api";

type TestPlanAction = (
  resolveConflicts: boolean,
) => Promise<TestPlanDetail | TestPlanMutationResult>;

type PendingConflict = {
  action: TestPlanAction;
  conflicts: TestPlanMemberConflict[];
  onDone?: () => void;
};

/**
 * 提测单写操作的统一执行：成功后刷新详情和列表；遇到成员冲突时先不改任何数据，
 * 返回冲突清单交给确认弹窗，用户确认后带 resolveConflicts 重新提交。
 */
export function useTestPlanAction(planId: string) {
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(null);

  const finish = (result: TestPlanDetail | TestPlanMutationResult) => {
    queryClient.setQueryData(testPlanDetailQueryKey(planId), result);
    // 其他提测单可能因为冲突被移出了成员，一并刷新列表和详情。
    void queryClient.invalidateQueries({ queryKey: testPlansRootQueryKey });
    if ("removed" in result && result.removed.length > 0) {
      setNotice(
        result.removed.map((item) => `${item.userId} 已从「${item.testPlan.name}」移出`).join("；"),
      );
    }
  };

  const execute = async (
    action: TestPlanAction,
    resolveConflicts: boolean,
    onDone?: () => void,
  ) => {
    setError("");
    setIsPending(true);
    try {
      finish(await action(resolveConflicts));
      onDone?.();
      return true;
    } catch (cause) {
      const conflicts = cause instanceof TestPlanAPIError ? cause.memberConflicts : null;
      if (conflicts && !resolveConflicts) {
        setPendingConflict({ action, conflicts, onDone });
      } else {
        setError(cause instanceof Error ? cause.message : "操作失败，请稍后重试");
      }
      return false;
    } finally {
      setIsPending(false);
    }
  };

  return {
    error,
    isPending,
    notice,
    pendingConflict,
    clearError: () => setError(""),
    clearNotice: () => setNotice(""),
    run: (action: TestPlanAction, onDone?: () => void) => execute(action, false, onDone),
    cancelConflict: () => setPendingConflict(null),
    confirmConflict: async () => {
      if (!pendingConflict) {
        return;
      }
      const { action, onDone } = pendingConflict;
      setPendingConflict(null);
      await execute(action, true, onDone);
    },
  };
}
