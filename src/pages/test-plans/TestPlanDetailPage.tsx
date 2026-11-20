import { skipToken, useQuery } from "@tanstack/react-query";
import { ExternalLink, LogIn, LogOut, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageErrorState, PageHeader, PageSkeleton, SectionCard } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import {
  addTestPlanMembers,
  closeTestPlan,
  deleteTestPlanItem,
  extendTestPlan,
  fetchMyTestAccounts,
  fetchTestPlanDetail,
  joinTestPlan,
  leaveTestPlan,
  removeTestPlanMember,
  setTestPlanItem,
  type TestPlanItemRecord,
  testAccountsQueryKey,
  testPlanDetailQueryKey,
  updateTestPlan,
} from "./api";
import { TestAccountsDialog } from "./components/TestAccountsDialog";
import { TestPlanConflictDialog } from "./components/TestPlanConflictDialog";
import { TestPlanItemDialog } from "./components/TestPlanItemDialog";
import { TestPlanMemberDialog } from "./components/TestPlanMemberDialog";
import { TestPlanSettingsDialog } from "./components/TestPlanSettingsDialog";
import { testPlanItemModeLabels, testPlanStatusClass, testPlanStatusLabels } from "./constants";
import { useTestPlanAction } from "./hooks";
import {
  describeTestPlanEvent,
  expiresAtAfterDays,
  formatDateTime,
  formatRemaining,
  shortSha,
} from "./utils";

type TestPlanDetailPageProps = {
  id: string;
  onBack: () => void;
  onOpenBuild: (buildId: string) => void;
};

type DialogState =
  | { kind: "item"; item: TestPlanItemRecord | null }
  | { kind: "member" }
  | { kind: "settings" }
  | { kind: "close" }
  | { kind: "accounts" }
  | null;

export function TestPlanDetailPage({ id, onBack, onOpenBuild }: TestPlanDetailPageProps) {
  const { data, error, isPending, refetch } = useQuery({
    queryFn: () => fetchTestPlanDetail(id),
    queryKey: testPlanDetailQueryKey(id),
  });
  const { data: myAccounts = [] } = useQuery({
    queryFn: data ? fetchMyTestAccounts : skipToken,
    queryKey: testAccountsQueryKey,
  });
  const action = useTestPlanAction(id);
  const [dialog, setDialog] = useState<DialogState>(null);
  const closeDialog = () => {
    setDialog(null);
    action.clearError();
  };

  const moduleNames = useMemo(
    () => Object.fromEntries((data?.items ?? []).map((item) => [item.moduleId, item.moduleName])),
    [data?.items],
  );

  if (isPending) {
    return <PageSkeleton />;
  }
  if (error || !data) {
    return (
      <PageErrorState
        title="提测单加载失败"
        message={error instanceof Error ? error.message : "提测单不存在"}
        onRetry={() => void refetch()}
      />
    );
  }

  const { testPlan: plan, items, members, events } = data;
  const isOpen = plan.status === "open";
  const memberIds = new Set(members.map((member) => member.userId));
  const myAccountsHere = myAccounts.filter((account) => account.environment === plan.environment);
  const myJoinedAccounts = myAccountsHere.filter((account) => memberIds.has(account.userId));
  const myPendingAccounts = myAccountsHere.filter((account) => !memberIds.has(account.userId));
  // 弹窗里的错误只在对应弹窗打开时显示，避免和页面顶部的错误重复。
  const pageError = dialog ? "" : action.error;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        onBack={onBack}
        backLabel="提测单"
        title={plan.name}
        description={`${plan.applicationName} · ${plan.environmentName || plan.environment} · ${plan.createdBy} 创建于 ${formatDateTime(plan.createdAt)}`}
        meta={
          <div className="flex items-center gap-2 text-xs">
            <span
              className={cn("rounded-md px-2 py-0.5 font-medium", testPlanStatusClass[plan.status])}
            >
              {testPlanStatusLabels[plan.status]}
            </span>
            <span className="text-muted-foreground">
              {isOpen ? `${formatRemaining(plan.expiresAt)}，` : ""}到期{" "}
              {formatDateTime(plan.expiresAt)}
            </span>
          </div>
        }
        actions={
          isOpen ? (
            <>
              {myJoinedAccounts.length > 0 ? (
                <Button
                  variant="outline"
                  disabled={action.isPending}
                  onClick={() =>
                    void action.run(() =>
                      leaveTestPlan(id, { userIds: myJoinedAccounts.map((a) => a.userId) }),
                    )
                  }
                >
                  <LogOut className="size-4" />
                  退出
                </Button>
              ) : null}
              <Button
                variant="outline"
                disabled={action.isPending}
                onClick={() => {
                  if (myPendingAccounts.length === 0) {
                    setDialog({ kind: "accounts" });
                    return;
                  }
                  void action.run((resolveConflicts) =>
                    joinTestPlan(id, {
                      resolveConflicts,
                      userIds: myPendingAccounts.map((account) => account.userId),
                    }),
                  );
                }}
              >
                <LogIn className="size-4" />
                {myPendingAccounts.length > 0 ? "用我的测试账号加入" : "添加我的测试账号"}
              </Button>
              <Button variant="outline" onClick={() => setDialog({ kind: "settings" })}>
                <Pencil className="size-4" />
                编辑
              </Button>
              <Button variant="outline" onClick={() => setDialog({ kind: "close" })}>
                关闭提测单
              </Button>
            </>
          ) : null
        }
      />

      {plan.link ? (
        <a
          href={plan.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-fit items-center gap-1 text-primary text-sm hover:underline"
        >
          关联链接
          <ExternalLink className="size-3.5" />
        </a>
      ) : null}
      {!isOpen ? (
        <Alert variant="warning">
          提测单已{plan.status === "closed" ? "关闭" : "过期"}
          ，不再对客户端生效，也不能修改。需要继续测试请新建提测单。
        </Alert>
      ) : null}
      {action.notice ? (
        <Alert variant="info">
          <div className="flex items-start justify-between gap-3">
            <span>{action.notice}</span>
            <Button variant="link" className="h-auto p-0 text-xs" onClick={action.clearNotice}>
              知道了
            </Button>
          </div>
        </Alert>
      ) : null}
      {pageError ? <Alert variant="danger">{pageError}</Alert> : null}
      {data.commonDependencyWarning ? (
        <Alert variant="warning">
          这张提测单同时包含 Common 模块和业务模块。业务模块构建时注入的是已发布的
          common，不是本提测单里的 common 构建，两者可能不兼容，请核对各条目的 runtimeVersion。
        </Alert>
      ) : null}

      <SectionCard
        title="条目"
        description="客户端请求时，提测单成员的这些模块会拿到条目里的构建；runtimeVersion 不一致的条目对该客户端不生效。"
        actions={
          isOpen ? (
            <Button size="sm" onClick={() => setDialog({ kind: "item", item: null })}>
              <Plus className="size-3.5" />
              添加条目
            </Button>
          ) : null
        }
      >
        {items.length === 0 ? (
          <p className="m-0 text-muted-foreground text-sm">还没有条目。</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.moduleId}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-muted px-3 py-2.5 text-sm"
              >
                <div className="min-w-40">
                  <div className="font-medium text-foreground">{item.moduleName}</div>
                  <div className="text-faint text-xs">
                    {item.moduleId} · {item.moduleKind === "Common" ? "通用模块" : "业务模块"}
                  </div>
                </div>
                <span className="font-mono text-xs">{item.branch}</span>
                <span className="rounded bg-background px-1.5 py-0.5 text-muted-foreground text-xs">
                  {testPlanItemModeLabels[item.mode]}
                </span>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => onOpenBuild(item.buildRecordId)}
                >
                  #{item.buildNumber} · {shortSha(item.commitSha)}
                </Button>
                <span className="text-muted-foreground text-xs">{item.runtimeVersion}</span>
                <span className="ml-auto text-faint text-xs">
                  {item.updatedBy || "自动更新"} · {formatDateTime(item.updatedAt)}
                </span>
                {isOpen ? (
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={`修改 ${item.moduleName}`}
                      onClick={() => setDialog({ kind: "item", item })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      aria-label={`移除 ${item.moduleName}`}
                      disabled={action.isPending}
                      onClick={() => void action.run(() => deleteTestPlanItem(id, item.moduleId))}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={`成员 · ${members.length}`}
        description="客户端上报的 userId。同一个账号在同一模块上只能属于一张进行中的提测单。"
        actions={
          isOpen ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "accounts" })}>
                <UserRound className="size-3.5" />
                我的测试账号
              </Button>
              <Button size="sm" onClick={() => setDialog({ kind: "member" })}>
                <Plus className="size-3.5" />
                添加成员
              </Button>
            </div>
          ) : null
        }
      >
        {members.length === 0 ? (
          <p className="m-0 text-muted-foreground text-sm">还没有成员。</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <div
                key={member.userId}
                className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 text-sm"
              >
                <span className="font-mono">{member.userId}</span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground text-xs">
                  {member.note || (member.addedBy ? `${member.addedBy} 添加` : "")}
                </span>
                {isOpen ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label={`移除成员 ${member.userId}`}
                    disabled={action.isPending}
                    onClick={() => void action.run(() => removeTestPlanMember(id, member.userId))}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="操作记录">
        <ol className="m-0 flex list-none flex-col gap-1.5 p-0">
          {events.map((event) => (
            <li key={event.id} className="flex flex-wrap gap-x-3 text-sm">
              <span className="w-24 shrink-0 text-faint text-xs leading-5">
                {formatDateTime(event.createdAt)}
              </span>
              <span className="text-muted-foreground">{event.actor || "系统"}</span>
              <span className="min-w-0 flex-1 text-foreground">{describeTestPlanEvent(event)}</span>
            </li>
          ))}
        </ol>
      </SectionCard>

      <TestPlanItemDialog
        applicationId={plan.applicationId}
        environment={plan.environment}
        error={dialog?.kind === "item" ? action.error : ""}
        isOpen={dialog?.kind === "item"}
        isPending={action.isPending}
        item={dialog?.kind === "item" ? dialog.item : null}
        onClose={closeDialog}
        onSubmit={(form) =>
          void action.run(
            (resolveConflicts) =>
              setTestPlanItem(id, form.moduleId, {
                branch: form.branch.trim(),
                buildRecordId: form.mode === "pinned" ? form.buildRecordId : "",
                mode: form.mode,
                resolveConflicts,
              }),
            closeDialog,
          )
        }
        usedModuleIds={items.map((item) => item.moduleId)}
      />
      <TestPlanMemberDialog
        error={dialog?.kind === "member" ? action.error : ""}
        isOpen={dialog?.kind === "member"}
        isPending={action.isPending}
        onClose={closeDialog}
        onSubmit={(form) =>
          void action.run(
            (resolveConflicts) =>
              addTestPlanMembers(id, {
                members: [{ note: form.note.trim(), userId: form.userId.trim() }],
                resolveConflicts,
              }),
            closeDialog,
          )
        }
      />
      <TestPlanSettingsDialog
        error={dialog?.kind === "settings" ? action.error : ""}
        isOpen={dialog?.kind === "settings"}
        isPending={action.isPending}
        onClose={closeDialog}
        onSubmit={(form) =>
          void action.run(async () => {
            const detail = await updateTestPlan(id, {
              link: form.link.trim(),
              name: form.name.trim(),
            });
            return form.ttlDays ? extendTestPlan(id, expiresAtAfterDays(form.ttlDays)) : detail;
          }, closeDialog)
        }
        plan={plan}
      />
      <ConfirmDialog
        confirmLabel="关闭"
        description="关闭后提测单立即不再对客户端生效，成员会回到正常的全量和灰度，不能重新打开。"
        isOpen={dialog?.kind === "close"}
        isPending={action.isPending}
        onCancel={closeDialog}
        onConfirm={() => void action.run(() => closeTestPlan(id), closeDialog)}
        title="关闭这张提测单？"
        tone="danger"
      />
      <TestAccountsDialog
        defaultEnvironment={plan.environment}
        isOpen={dialog?.kind === "accounts"}
        onClose={closeDialog}
      />
      <TestPlanConflictDialog
        conflicts={action.pendingConflict?.conflicts ?? null}
        isPending={action.isPending}
        moduleNames={moduleNames}
        onCancel={action.cancelConflict}
        onConfirm={() => void action.confirmConflict()}
      />
    </div>
  );
}
