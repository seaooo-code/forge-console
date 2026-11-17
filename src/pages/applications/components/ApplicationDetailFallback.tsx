import { CircleAlert } from "lucide-react";

import { PageHeader } from "@/components/layout";
import { Card } from "@/components/ui/card";

type ApplicationDetailFallbackProps = {
  isFetching: boolean;
  onBack: () => void;
};

export function ApplicationDetailFallback({ isFetching, onBack }: ApplicationDetailFallbackProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader onBack={onBack} backLabel="返回应用管理" title="应用详情" />
      <Card className="rounded-xl p-6">
        {isFetching ? (
          <div className="space-y-3">
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
            <div className="h-32 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <div className="font-semibold text-foreground">未找到应用详情</div>
              <div className="mt-1 text-muted-foreground text-sm">
                当前接口没有返回对应的宿主应用。
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
