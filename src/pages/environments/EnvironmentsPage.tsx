import { ArrowRight, Clock3, type LucideIcon, Server, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MiCarEnvironmentCode } from "@/types/environments";

import type {
  EnvironmentCardTone,
  EnvironmentStatus,
  EnvironmentsSnapshot,
  RuntimeEnvironment,
} from "./types";

type EnvironmentsPageProps = {
  onOpenEnvironment: (environmentId: MiCarEnvironmentCode) => void;
  snapshot: EnvironmentsSnapshot;
};

const environmentToneClass: Record<EnvironmentCardTone, string> = {
  amber: "border-t-amber-500",
  blue: "border-t-blue-500",
  emerald: "border-t-emerald-500",
  rose: "border-t-rose-500",
  sky: "border-t-sky-500",
};

const statusClass: Record<EnvironmentStatus, string> = {
  健康: "border-emerald-200 bg-emerald-50 text-emerald-700",
  灰度中: "border-amber-200 bg-amber-50 text-amber-700",
};

export function EnvironmentsPage({ onOpenEnvironment, snapshot }: EnvironmentsPageProps) {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div>
          <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">环境管理</h1>
          <p className="mt-2 text-slate-600 text-sm">
            管理 dev / staging / preview / preProduct / product 五套运行环境
          </p>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 xl:grid-cols-5">
          {snapshot.environments.map((environment) => (
            <EnvironmentCard
              key={environment.id}
              environment={environment}
              onOpen={() => onOpenEnvironment(environment.id)}
            />
          ))}
        </section>
      </div>
    </>
  );
}

function EnvironmentCard({
  environment,
  onOpen,
}: {
  environment: RuntimeEnvironment;
  onOpen: () => void;
}) {
  return (
    <Card
      className={cn(
        "gap-4 rounded-lg border-t-4 px-4 py-4 shadow-none",
        environmentToneClass[environment.tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <Server className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm">{environment.name}</div>
            <div className="font-mono text-slate-500 text-xs">{environment.code}</div>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex h-6 shrink-0 items-center rounded border px-2 font-medium text-xs leading-none",
            statusClass[environment.status],
          )}
        >
          {environment.status}
        </span>
      </div>

      <p className="min-h-10 text-slate-600 text-sm leading-5">{environment.description}</p>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <InfoMetric icon={Waves} label="流量" value={environment.traffic} />
        <InfoMetric icon={Clock3} label="更新" value={environment.updatedAt} />
      </div>

      <Button
        variant="outline"
        type="button"
        className="h-9 w-full border-slate-200 bg-white font-medium text-blue-600 text-xs hover:bg-blue-50 hover:text-blue-700"
        onClick={onOpen}
      >
        进入环境详情
        <ArrowRight className="size-3.5" />
      </Button>
    </Card>
  );
}

function InfoMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex items-center gap-1 text-slate-500">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <div className="truncate font-semibold text-slate-800">{value}</div>
    </div>
  );
}
