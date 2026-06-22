import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Box,
  CalendarClock,
  ExternalLink,
  PackageCheck,
  RadioTower,
  Rocket,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { fetchModuleDetailSnapshot, moduleDetailQueryKey } from "@/api/modules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  fetchReleaseRecordDetail,
  releaseRecordDetailQueryKey,
} from "./api/release-records-snapshot";
import {
  releaseRecordStatusClass,
  releaseRecordStatusLabels,
  releaseRecordTypeLabels,
} from "./constants";
import type { ReleaseRecordDetail, ReleaseRecordStatus, ReleaseRecordType } from "./types";

type ReleaseRecordDetailPageProps = {
  onBack: () => void;
  onOpenApplication: (applicationSlug: string) => void;
  onOpenBuild: (buildId: string) => void;
  onOpenEnvironment: (environmentId: string) => void;
  onOpenModule: (moduleId: string) => void;
  releaseId: string;
};

export function ReleaseRecordDetailPage({
  onBack,
  onOpenApplication,
  onOpenBuild,
  onOpenEnvironment,
  onOpenModule,
  releaseId,
}: ReleaseRecordDetailPageProps) {
  const {
    data: release,
    error,
    isFetching,
  } = useQuery({
    queryFn: () => fetchReleaseRecordDetail(releaseId),
    queryKey: releaseRecordDetailQueryKey(releaseId),
  });
  const releaseModuleId = release?.moduleId;
  const { data: moduleSnapshot } = useQuery({
    enabled: Boolean(releaseModuleId && releaseModuleId !== "-"),
    queryFn: () => fetchModuleDetailSnapshot(releaseModuleId ?? ""),
    queryKey: moduleDetailQueryKey(releaseModuleId),
  });

  if (!release) {
    return <ReleaseRecordDetailFallback error={error} isFetching={isFetching} onBack={onBack} />;
  }

  const applicationSlug = moduleSnapshot?.modules[0]?.applicationSlug ?? "";
  const releaseTarget = getReleaseTargetLabel(release);

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <Button
              variant="ghost"
              type="button"
              className="-ml-2 mb-3 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
              返回发布记录
            </Button>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                <RadioTower className="size-5" />
              </div>
              <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">
                发布 {formatShortRecordID(release.id)}
              </h1>
              <ReleaseStatusBadge status={release.status} />
              <ReleaseTypeBadge releaseType={release.releaseType} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              type="button"
              className="border-slate-200 bg-white text-slate-700"
              onClick={() => onOpenBuild(release.buildRecordId)}
            >
              <PackageCheck className="size-4" />
              打开构建
            </Button>
            {release.artifactUrl ? (
              <Button asChild type="button" className="bg-blue-600 text-white hover:bg-blue-700">
                <a href={release.artifactUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" />
                  打开产物
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        {release.description ? (
          <section className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
            <div className="flex items-start gap-2">
              <Rocket className="mt-0.5 size-4 shrink-0" />
              <div>
                <div className="font-semibold text-sm">发布说明</div>
                <div className="mt-1 whitespace-pre-wrap text-sm leading-6">
                  {release.description}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <SectionHeader title="发布信息" />
            <div className="grid gap-3 p-4 md:grid-cols-2">
              <DetailItem icon={CalendarClock} label="发布时间" value={release.createdAt} />
              <DetailItem icon={CalendarClock} label="更新时间" value={release.updatedAtFull} />
              <DetailItem
                icon={RadioTower}
                label="发布目标"
                value={releaseTarget}
                description={release.releaseType === "targeted" ? release.identifier : undefined}
              />
              <DetailItem icon={UserRound} label="操作人" value={release.operator} />
            </div>
          </Card>

          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <SectionHeader title="路由指向" />
            <div className="grid gap-3 p-4 md:grid-cols-2">
              <DetailItem
                icon={Box}
                label="应用"
                value={release.application}
                onClick={applicationSlug ? () => onOpenApplication(applicationSlug) : undefined}
              />
              <DetailItem
                icon={RadioTower}
                label="环境"
                value={release.environmentName}
                description={release.environment}
                onClick={
                  release.environment && release.environment !== "-"
                    ? () => onOpenEnvironment(release.environment)
                    : undefined
                }
              />
              <DetailItem
                icon={Box}
                label="模块"
                value={release.module}
                description={release.moduleId}
                onClick={
                  release.moduleId && release.moduleId !== "-"
                    ? () => onOpenModule(release.moduleId)
                    : undefined
                }
              />
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}

function ReleaseRecordDetailFallback({
  error,
  isFetching,
  onBack,
}: {
  error: Error | null;
  isFetching: boolean;
  onBack: () => void;
}) {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <Button
          variant="ghost"
          type="button"
          className="-ml-2 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          返回发布记录
        </Button>
      </div>
      <div className="px-6 py-5">
        <Card className="rounded-lg border-slate-200 p-8 text-center shadow-sm">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <RadioTower className="size-5" />
          </div>
          <div className="mt-3 font-semibold text-slate-950">
            {isFetching ? "正在加载发布记录详情" : "未找到发布记录"}
          </div>
          <div className="mt-2 text-slate-500 text-sm">
            {error instanceof Error ? error.message : "发布记录可能已被删除或当前账号无权限访问。"}
          </div>
        </Card>
      </div>
    </>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex h-12 items-center justify-between border-slate-200 border-b px-4">
      <div>
        <div className="font-semibold text-slate-900 text-sm">{title}</div>
      </div>
    </div>
  );
}

function DetailItem({
  description,
  icon: Icon,
  label,
  onClick,
  value,
  wide = false,
}: {
  description?: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  value: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2",
        wide && "md:col-span-2",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <div className="text-slate-500 text-xs">{label}</div>
        {onClick ? (
          <Button
            variant="link"
            type="button"
            className="h-auto min-w-0 justify-start break-all p-0 text-left font-semibold text-blue-600 text-sm"
            onClick={onClick}
          >
            {value || "-"}
          </Button>
        ) : (
          <div className="break-all font-semibold text-slate-800 text-sm">{value || "-"}</div>
        )}
        {description ? (
          <div className="mt-0.5 break-all text-slate-500 text-xs">{description}</div>
        ) : null}
      </div>
    </div>
  );
}

function ReleaseStatusBadge({ status }: { status: ReleaseRecordStatus }) {
  const Icon = status === "active" ? ShieldCheck : Rocket;

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded border px-2 font-semibold text-xs leading-none",
        releaseRecordStatusClass[status],
      )}
    >
      <Icon className="size-3" />
      {releaseRecordStatusLabels[status]}
    </span>
  );
}

function ReleaseTypeBadge({ releaseType }: { releaseType: ReleaseRecordType }) {
  return (
    <Badge variant="outline" className="border-slate-200 font-medium text-slate-600">
      {releaseRecordTypeLabels[releaseType]}
    </Badge>
  );
}

function getReleaseTargetLabel(release: ReleaseRecordDetail) {
  if (release.releaseType === "targeted") {
    return release.identifier ? `标识 ${release.identifier}` : "标识发布";
  }

  return "默认访问路由";
}

function formatShortRecordID(value: string) {
  const normalized = value.trim();
  return normalized ? `#${normalized.slice(-8)}` : "-";
}
