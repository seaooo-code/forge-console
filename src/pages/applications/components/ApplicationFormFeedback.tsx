import { PageHeader } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

import type { ApplicationFormFeedbackProps } from "../types";

export function ApplicationFormLoading({ onBack }: ApplicationFormFeedbackProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader onBack={onBack} backLabel="返回应用管理" title="加载中" />
      <Card className="rounded-xl p-6">
        <div className="space-y-3">
          <div className="h-5 w-36 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-40 w-full animate-pulse rounded bg-muted" />
        </div>
      </Card>
    </div>
  );
}

export function ApplicationFormOptionsError({ onBack }: ApplicationFormFeedbackProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader onBack={onBack} backLabel="返回应用管理" title="应用选项加载失败" />
      <Alert variant="danger" className="border-destructive/30 bg-destructive/10">
        应用选项加载失败，请刷新后重试
      </Alert>
    </div>
  );
}

export function ApplicationFormNotFound({ onBack }: ApplicationFormFeedbackProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader onBack={onBack} backLabel="返回应用管理" title="应用不存在" />
      <Card className="rounded-xl bg-card p-6">
        <div className="font-semibold text-foreground text-sm">应用不存在</div>
        <p className="mt-1 text-muted-foreground text-sm">当前应用可能已被删除或路径无效。</p>
      </Card>
    </div>
  );
}
