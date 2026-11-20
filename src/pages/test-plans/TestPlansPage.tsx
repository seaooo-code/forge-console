import { useQuery } from "@tanstack/react-query";
import { CircleDot, ClipboardCheck, Plus, RefreshCw, UserRound } from "lucide-react";
import { useState } from "react";

import { ConsoleClearableFilterSelect } from "@/components/common/ConsoleControls";
import { EmptyState } from "@/components/common/StateBlock";
import { ErrorMessage, FilterBar, ListHeader, SummaryStats } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useApplicationScopeStore } from "@/store/use-application-scope-store";
import { useAuthStore } from "@/store/use-auth-store";

import { fetchTestPlans, testPlansQueryKey } from "./api";
import { TestAccountsDialog } from "./components/TestAccountsDialog";
import { TestPlanCreateDialog } from "./components/TestPlanCreateDialog";
import {
  testPlanStatusClass,
  testPlanStatusFilterOptions,
  testPlanStatusLabels,
} from "./constants";
import type { TestPlanListFilters, TestPlanStatusFilter } from "./types";
import { formatDateTime, formatRemaining } from "./utils";

type TestPlansPageProps = {
  onOpenTestPlan: (id: string) => void;
};

/** 提测单列表：按左上角选中的应用过滤，默认只看进行中的提测单。 */
export function TestPlansPage({ onOpenTestPlan }: TestPlansPageProps) {
  const applicationId = useApplicationScopeStore((state) => state.applicationId);
  const session = useAuthStore((state) => state.session);
  const [status, setStatus] = useState<TestPlanStatusFilter>("open");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const filters: TestPlanListFilters = { applicationId, environment: "", status };
  const { data, error, isFetching, refetch } = useQuery({
    queryFn: () => fetchTestPlans(filters),
    queryKey: testPlansQueryKey(filters),
  });
  const plans = data?.testPlans ?? [];
  const openCount = plans.filter((plan) => plan.status === "open").length;

  return (
    <div className="flex flex-col gap-5">
      <ListHeader
        title="提测单"
        summary={
          <SummaryStats
            items={[
              { id: "total", label: "张提测单", value: data ? plans.length : "-" },
              { id: "open", label: "张进行中", tone: "success", value: data ? openCount : "-" },
            ]}
          />
        }
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="刷新提测单"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            </Button>
            <Button variant="outline" onClick={() => setIsAccountsOpen(true)}>
              <UserRound className="size-4" />
              我的测试账号
            </Button>
            <Button onClick={() => setIsCreateOpen(true)} disabled={!session}>
              <Plus className="size-4" />
              新建提测单
            </Button>
          </>
        }
      />

      <FilterBar
        primary={
          <ConsoleClearableFilterSelect
            icon={CircleDot}
            label={
              status
                ? `状态：${testPlanStatusFilterOptions.find((option) => option.value === status)?.label}`
                : "状态"
            }
            options={testPlanStatusFilterOptions}
            value={status}
            clearLabel="清空状态筛选"
            onClear={() => setStatus("")}
            onValueChange={(value) => setStatus(value as TestPlanStatusFilter)}
          />
        }
      />

      {error ? <ErrorMessage error={error} onRetry={() => void refetch()} /> : null}

      {data && plans.length === 0 ? (
        <div className="rounded-xl bg-card p-10 shadow-edge">
          <EmptyState
            icon={ClipboardCheck}
            title={status === "open" ? "没有进行中的提测单" : "没有提测单"}
            description="一个需求一张提测单：选好要测的模块分支，再把测试账号加进来，App 就会拿到这些构建。"
          />
        </div>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => onOpenTestPlan(plan.id)}
              className="flex flex-col gap-3 rounded-xl bg-card p-4 text-left shadow-edge transition-colors hover:bg-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-foreground text-sm">{plan.name}</div>
                  <div className="mt-0.5 truncate text-muted-foreground text-xs">
                    {plan.applicationName} · {plan.environmentName || plan.environment}
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-md px-2 py-0.5 font-medium text-xs",
                    testPlanStatusClass[plan.status],
                  )}
                >
                  {testPlanStatusLabels[plan.status]}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
                <span>{plan.itemCount} 个模块</span>
                <span>{plan.memberCount} 个账号</span>
                <span>
                  {plan.status === "open"
                    ? formatRemaining(plan.expiresAt)
                    : `到期 ${formatDateTime(plan.expiresAt)}`}
                </span>
                <span className="ml-auto">{plan.createdBy}</span>
              </div>
            </button>
          ))}
        </section>
      )}

      <TestPlanCreateDialog
        defaultApplicationId={applicationId}
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(id) => {
          setIsCreateOpen(false);
          onOpenTestPlan(id);
        }}
      />
      <TestAccountsDialog isOpen={isAccountsOpen} onClose={() => setIsAccountsOpen(false)} />
    </div>
  );
}
