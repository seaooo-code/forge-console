import {
  Activity,
  ArrowLeft,
  CircleAlert,
  Clock3,
  Code2,
  type LucideIcon,
  Palette,
  RadioTower,
  Server,
  Type,
} from "lucide-react";

import { miCarEnvironmentBadgeClass } from "@/components/common/EnvironmentBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { EnvironmentCode, EnvironmentStatus, EnvironmentsSnapshot } from "./types";

type EnvironmentDetailPageProps = {
  environmentId: EnvironmentCode;
  isFetching: boolean;
  onBack: () => void;
  snapshot: EnvironmentsSnapshot;
};

const statusClass: Record<EnvironmentStatus, string> = {
  健康: "border-emerald-200 bg-emerald-50 text-emerald-700",
  灰度中: "border-amber-200 bg-amber-50 text-amber-700",
};

export function EnvironmentDetailPage({
  environmentId,
  isFetching,
  onBack,
  snapshot,
}: EnvironmentDetailPageProps) {
  const environment =
    snapshot.details[environmentId] ??
    snapshot.environments.find((item) => item.id === environmentId);

  if (!environment) {
    return <EnvironmentDetailFallback isFetching={isFetching} onBack={onBack} />;
  }

  const entityFields = [
    { icon: Server, id: "id", label: "环境 ID", value: environment.id },
    { icon: Code2, id: "code", label: "环境短码", value: environment.code },
    { icon: Type, id: "name", label: "环境名称", value: environment.name },
    { icon: Activity, id: "status", label: "状态", value: environment.status },
    { icon: Palette, id: "tone", label: "视觉标识", value: environment.tone },
    { icon: RadioTower, id: "traffic", label: "流量", value: environment.traffic },
    { icon: Clock3, id: "updatedAt", label: "更新时间", value: environment.updatedAt },
  ];

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <div className="mb-3">
            <Button
              variant="ghost"
              type="button"
              className="-ml-2 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              onClick={onBack}
            >
              <ArrowLeft className="size-4" />
              返回环境管理
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">
              {environment.name}
            </h1>
            <span
              className={cn(
                "inline-flex h-6 items-center rounded border px-2 font-medium text-xs leading-none",
                statusClass[environment.status],
              )}
            >
              {environment.status}
            </span>
            <span
              className={cn(
                "inline-flex h-6 items-center rounded border px-2 font-mono font-semibold text-xs leading-none",
                miCarEnvironmentBadgeClass[environment.id],
              )}
            >
              {environment.code}
            </span>
          </div>
          <p className="mt-2 text-slate-600 text-sm">{environment.description}</p>
        </div>
      </div>

      <div className="px-6 py-5">
        <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
          <CardHeader className="h-12 justify-center border-slate-200 border-b px-4">
            <CardTitle className="font-semibold text-slate-900 text-sm">环境实体字段</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {entityFields.map((field) => (
              <EntityField
                key={field.id}
                icon={field.icon}
                label={field.label}
                value={field.value}
              />
            ))}
            <EntityField
              icon={Type}
              label="描述"
              value={environment.description}
              className="md:col-span-2 xl:col-span-3"
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function EntityField({
  className,
  icon: Icon,
  label,
  value,
}: {
  className?: string;
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 gap-3 rounded-md border border-slate-200 bg-white px-3 py-3",
        className,
      )}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-slate-500 text-xs">{label}</div>
        <div className="mt-1 break-all font-semibold text-slate-800 text-sm">{value || "-"}</div>
      </div>
    </div>
  );
}

function EnvironmentDetailFallback({
  isFetching,
  onBack,
}: {
  isFetching: boolean;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4 px-6 py-5">
      <Button
        variant="ghost"
        type="button"
        className="-ml-2 h-8 gap-2 px-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        onClick={onBack}
      >
        <ArrowLeft className="size-4" />
        返回环境管理
      </Button>

      <Card className="rounded-lg border-slate-200 p-6 shadow-none">
        {isFetching ? (
          <div className="space-y-3">
            <div className="h-5 w-36 animate-pulse rounded bg-slate-100" />
            <div className="h-10 w-full animate-pulse rounded bg-slate-100" />
            <div className="h-32 w-full animate-pulse rounded bg-slate-100" />
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-500" />
            <div>
              <div className="font-semibold text-slate-900">未找到环境详情</div>
              <div className="mt-1 text-slate-500 text-sm">
                当前项目只支持 dev、staging、preview、preProduct、product 五个环境。
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
