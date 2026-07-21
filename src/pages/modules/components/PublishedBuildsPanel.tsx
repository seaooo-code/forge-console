import { Rocket, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getReleaseRecordTargetLabel,
  getReleaseRecordTypeLabel,
  type ReleasePointerRecord,
  releaseRecordStatusClass,
} from "@/pages/release-records";

export function PublishedBuildsPanel({
  isFetching,
  records,
}: {
  isFetching: boolean;
  records: ReleasePointerRecord[];
}) {
  return (
    <Card className="gap-0 rounded-lg border-border py-0 shadow-sm">
      <SectionHeader title="已发布构建" description="当前模块已发布的全量和标识构建" />
      {records.length > 0 ? (
        <div className="overflow-hidden">
          <div className="hidden border-border border-b bg-muted px-4 py-2 font-medium text-muted-foreground text-xs xl:grid xl:grid-cols-[110px_170px_110px_100px_minmax(140px,1fr)_92px_120px]">
            <span>构建 ID</span>
            <span>发布时间</span>
            <span>环境</span>
            <span>发布类型</span>
            <span>标识</span>
            <span>状态</span>
            <span>操作人</span>
          </div>
          <div className="divide-y divide-border">
            {records.map((record) => (
              <div
                key={record.id}
                className="grid gap-2 px-4 py-3 text-sm xl:grid-cols-[110px_170px_110px_100px_minmax(140px,1fr)_92px_120px] xl:items-center"
              >
                <PublishedBuildField label="构建 ID">
                  <span className="font-mono font-semibold text-foreground text-xs">
                    {formatShortRecordID(record.buildRecordId)}
                  </span>
                </PublishedBuildField>
                <PublishedBuildField label="发布时间">
                  <span className="font-mono text-muted-foreground text-xs">
                    {record.createdAt}
                  </span>
                </PublishedBuildField>
                <PublishedBuildField label="环境">
                  <span className="truncate font-medium text-foreground">
                    {record.environmentName}
                  </span>
                </PublishedBuildField>
                <PublishedBuildField label="发布类型">
                  <span className="font-medium text-foreground text-xs">
                    {getReleaseRecordTypeLabel(record)}
                  </span>
                </PublishedBuildField>
                <PublishedBuildField label="标识">
                  <span className="truncate text-muted-foreground">
                    {getReleaseRecordTargetLabel(record)}
                  </span>
                </PublishedBuildField>
                <PublishedBuildField label="状态">
                  <ReleaseStatusBadge status={record.status} />
                </PublishedBuildField>
                <PublishedBuildField label="操作人">
                  <span className="truncate text-muted-foreground">{record.operator}</span>
                </PublishedBuildField>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-muted-foreground text-sm">
          {isFetching ? "正在加载已发布构建" : "暂无已发布构建"}
        </div>
      )}
    </Card>
  );
}

function SectionHeader({ description, title }: { description: string; title: string }) {
  return (
    <div className="flex h-12 items-center justify-between border-border border-b px-4">
      <div>
        <div className="font-semibold text-foreground text-sm">{title}</div>
        <div className="text-muted-foreground text-xs">{description}</div>
      </div>
    </div>
  );
}

function PublishedBuildField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-center gap-2 xl:block">
      <span className="font-medium text-muted-foreground text-xs xl:hidden">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ReleaseStatusBadge({ status }: { status: ReleasePointerRecord["status"] }) {
  const Icon = status === "active" ? ShieldCheck : Rocket;
  const label = status === "active" ? "生效中" : status === "inactive" ? "已失效" : "已撤销";

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded border px-2 font-semibold text-xs leading-none",
        releaseRecordStatusClass[status],
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

function formatShortRecordID(value: string) {
  const normalized = value.trim();
  return normalized ? `#${normalized.slice(-8)}` : "-";
}
