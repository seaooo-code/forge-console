import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Box,
  CalendarClock,
  CircleOff,
  ExternalLink,
  LoaderCircle,
  PackageCheck,
  RadioTower,
  Rocket,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { fetchModuleDetailSnapshot, moduleDetailQueryKey } from "@/api/modules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  fetchReleaseRecordDetail,
  inactivateTargetedGrayRelease,
  releaseRecordDetailQueryKey,
  releaseRecordsSnapshotQueryKey,
  updateReleaseGrayPercentage,
} from "./api/release-records-snapshot";
import {
  getReleaseRecordTargetLabel,
  getReleaseRecordTypeLabel,
  releaseRecordStatusClass,
  releaseRecordStatusLabels,
} from "./constants";
import type { ReleaseRecordDetail, ReleaseRecordStatus } from "./types";

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
  const queryClient = useQueryClient();
  const [grayPercentageInput, setGrayPercentageInput] = useState("0");
  const [grayPercentageError, setGrayPercentageError] = useState("");
  const [grayPercentageMessage, setGrayPercentageMessage] = useState("");
  const [inactivateError, setInactivateError] = useState("");
  const [inactivateMessage, setInactivateMessage] = useState("");
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
  const grayPercentageMutation = useMutation({
    mutationFn: (grayPercentage: number) => updateReleaseGrayPercentage(releaseId, grayPercentage),
    onError: (mutationError) => {
      setGrayPercentageMessage("");
      setGrayPercentageError(
        mutationError instanceof Error ? mutationError.message : "灰度比例更新失败",
      );
    },
    onSuccess: async (updatedRelease, grayPercentage) => {
      setGrayPercentageError("");
      setGrayPercentageMessage(grayPercentage === 100 ? "已转为全量发布" : "灰度比例已更新");
      setGrayPercentageInput(String(updatedRelease.grayPercentage));
      queryClient.setQueryData(releaseRecordDetailQueryKey(releaseId), updatedRelease);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: releaseRecordDetailQueryKey(releaseId) }),
        queryClient.invalidateQueries({ queryKey: releaseRecordsSnapshotQueryKey }),
        releaseModuleId && releaseModuleId !== "-"
          ? queryClient.invalidateQueries({ queryKey: moduleDetailQueryKey(releaseModuleId) })
          : Promise.resolve(),
      ]);
    },
  });
  const inactivateMutation = useMutation({
    mutationFn: () => inactivateTargetedGrayRelease(releaseId),
    onError: (mutationError) => {
      setInactivateMessage("");
      setInactivateError(
        mutationError instanceof Error ? mutationError.message : "定向灰度失效失败",
      );
    },
    onSuccess: async (updatedRelease) => {
      setInactivateError("");
      setInactivateMessage("定向灰度已失效");
      queryClient.setQueryData(releaseRecordDetailQueryKey(releaseId), updatedRelease);

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: releaseRecordDetailQueryKey(releaseId) }),
        queryClient.invalidateQueries({ queryKey: releaseRecordsSnapshotQueryKey }),
        releaseModuleId && releaseModuleId !== "-"
          ? queryClient.invalidateQueries({ queryKey: moduleDetailQueryKey(releaseModuleId) })
          : Promise.resolve(),
      ]);
    },
  });

  useEffect(() => {
    if (release?.releaseType === "gray" && release.grayStrategy === "percentage") {
      setGrayPercentageInput(String(release.grayPercentage));
      setGrayPercentageError("");
      setGrayPercentageMessage("");
    }
  }, [release?.grayPercentage, release?.grayStrategy, release?.releaseType]);

  if (!release) {
    return <ReleaseRecordDetailFallback error={error} isFetching={isFetching} onBack={onBack} />;
  }

  const applicationSlug = moduleSnapshot?.modules[0]?.applicationSlug ?? "";
  const releaseTarget = getReleaseTargetLabel(release);
  const canInactivateTargetedGray =
    release.status === "active" &&
    release.releaseType === "gray" &&
    release.grayStrategy === "targeted";

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
              <ReleaseTypeBadge release={release} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canInactivateTargetedGray ? (
              <Button
                variant="outline"
                type="button"
                className="border-rose-200 bg-white text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                disabled={inactivateMutation.isPending}
                onClick={() => {
                  if (!window.confirm("失效后该定向标识会回退到比例灰度或全量发布，是否继续？")) {
                    return;
                  }
                  setInactivateError("");
                  setInactivateMessage("");
                  inactivateMutation.mutate();
                }}
              >
                {inactivateMutation.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <CircleOff className="size-4" />
                )}
                {inactivateMutation.isPending ? "失效中" : "手动失效"}
              </Button>
            ) : null}
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

        {inactivateError || inactivateMessage ? (
          <section
            className={cn(
              "rounded-lg border px-4 py-3 text-sm",
              inactivateError
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {inactivateError || inactivateMessage}
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
                description={
                  release.releaseType === "gray" ? getReleaseRecordTypeLabel(release) : undefined
                }
              />
              {release.releaseType === "gray" && release.grayStrategy === "targeted" ? (
                <DetailItem
                  icon={CalendarClock}
                  label="过期时间"
                  value={release.expiresAt}
                  description="到期后自动失效"
                />
              ) : null}
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

        {release.releaseType === "gray" && release.grayStrategy === "percentage" ? (
          <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
            <SectionHeader title="比例灰度" />
            <div className="grid gap-4 p-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-medium text-slate-700 text-sm">当前比例</div>
                    <div className="mt-1 text-slate-500 text-xs">
                      当前生效比例为 {release.grayPercentage}%
                    </div>
                  </div>
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    {release.grayPercentage}%
                  </Badge>
                </div>
                <div className="grid gap-2 md:grid-cols-[minmax(0,260px)_minmax(0,1fr)] md:items-center">
                  <Input
                    min={0}
                    max={100}
                    type="number"
                    value={grayPercentageInput}
                    onChange={(event) => {
                      setGrayPercentageInput(event.target.value);
                      setGrayPercentageError("");
                      setGrayPercentageMessage("");
                    }}
                  />
                  {Number(grayPercentageInput) === 100 ? (
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-xs">
                      更新为 100% 后会转为全量发布，并替换当前默认路由。
                    </div>
                  ) : null}
                </div>
                {grayPercentageError ? (
                  <div className="text-red-600 text-xs">{grayPercentageError}</div>
                ) : null}
                {grayPercentageMessage ? (
                  <div className="text-emerald-700 text-xs">{grayPercentageMessage}</div>
                ) : null}
              </div>
              <Button
                type="button"
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={grayPercentageMutation.isPending}
                onClick={() => {
                  const nextPercentage = Number(grayPercentageInput);
                  if (
                    !Number.isInteger(nextPercentage) ||
                    nextPercentage < 0 ||
                    nextPercentage > 100
                  ) {
                    setGrayPercentageMessage("");
                    setGrayPercentageError("请输入 0 到 100 之间的整数");
                    return;
                  }
                  if (
                    nextPercentage === 100 &&
                    !window.confirm("比例更新为 100% 后将转为全量发布，是否继续？")
                  ) {
                    return;
                  }
                  grayPercentageMutation.mutate(nextPercentage);
                }}
              >
                {grayPercentageMutation.isPending ? "更新中" : "更新比例"}
              </Button>
            </div>
          </Card>
        ) : null}
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

function ReleaseTypeBadge({ release }: { release: ReleaseRecordDetail }) {
  return (
    <Badge variant="outline" className="border-slate-200 font-medium text-slate-600">
      {getReleaseRecordTypeLabel(release)}
    </Badge>
  );
}

function getReleaseTargetLabel(release: ReleaseRecordDetail) {
  return getReleaseRecordTargetLabel(release);
}

function formatShortRecordID(value: string) {
  const normalized = value.trim();
  return normalized ? `#${normalized.slice(-8)}` : "-";
}
