import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AccessTokensHeader() {
  return <PageHeader title="访问令牌" description="管理产物 manifest 与后端下载接口访问凭据" />;
}

export function AccessTokensPageError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <AccessTokensHeader />
      <Card className="rounded-xl border-destructive/30 bg-destructive/10 p-5 text-destructive shadow-xs">
        <div className="font-medium text-sm">访问令牌接口不可用</div>
        <div className="mt-2 text-sm">{message}</div>
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-destructive/30 bg-card text-destructive hover:bg-destructive/10"
          onClick={onRetry}
        >
          重试
        </Button>
      </Card>
    </div>
  );
}

export function AccessTokensPageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <AccessTokensHeader />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_23rem]">
        <Card className="h-72 animate-pulse rounded-xl border-border bg-card shadow-xs" />
        <Card className="h-72 animate-pulse rounded-xl border-border bg-card shadow-xs" />
      </div>
    </div>
  );
}
