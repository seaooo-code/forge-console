import { useQuery } from "@tanstack/react-query";
import { Clock3, Database, type LucideIcon, Pencil, Plus, Server } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

import { environmentsSnapshotQueryKey } from "./api/environment-query-keys";
import { fetchEnvironmentsSnapshot } from "./api/environments-snapshot";
import { environmentToneClass } from "./constants";
import type { RuntimeEnvironment } from "./types";

type EnvironmentsPageProps = {
  onCreateEnvironment: () => void;
  onEditEnvironment: (environmentId: string) => void;
};

export function EnvironmentsPage({
  onCreateEnvironment,
  onEditEnvironment,
}: EnvironmentsPageProps) {
  const session = useAuthStore((state) => state.session);
  const canManageEnvironments = Boolean(session?.capabilities.canManageEnvironments);
  const { data: snapshot } = useQuery({
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });

  if (!snapshot) {
    return <EnvironmentsPageLoading />;
  }

  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">环境管理</h1>
            <p className="mt-2 text-slate-600 text-sm">管理运行环境和对应的对象存储配置</p>
          </div>
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!canManageEnvironments}
            onClick={onCreateEnvironment}
          >
            <Plus className="size-4" />
            新建环境
          </Button>
        </div>
      </div>

      <div className="space-y-4 px-6 py-5">
        {snapshot.environments.length === 0 ? (
          <EmptyState
            canManageEnvironments={canManageEnvironments}
            onCreateEnvironment={onCreateEnvironment}
          />
        ) : null}

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.environments.map((environment) => (
            <EnvironmentCard
              key={environment.id}
              canManageEnvironments={canManageEnvironments}
              environment={environment}
              onEditEnvironment={onEditEnvironment}
            />
          ))}
        </section>
      </div>
    </>
  );
}

function EnvironmentsPageLoading() {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">环境管理</h1>
        <p className="mt-2 text-slate-600 text-sm">管理运行环境和对应的对象存储配置</p>
      </div>
      <div className="space-y-4 px-6 py-5">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {["one", "two", "three", "four"].map((item) => (
            <Card key={item} className="h-52 animate-pulse rounded-lg bg-white shadow-none" />
          ))}
        </section>
      </div>
    </>
  );
}

function EnvironmentCard({
  canManageEnvironments,
  environment,
  onEditEnvironment,
}: {
  canManageEnvironments: boolean;
  environment: RuntimeEnvironment;
  onEditEnvironment: (environmentId: string) => void;
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
          </div>
        </div>
      </div>

      <p className="min-h-10 text-slate-600 text-sm leading-5">{environment.description}</p>

      <InfoMetric icon={Clock3} label="更新" value={environment.updatedAt} />

      <InfoMetric icon={Database} label="存储配置" value={environment.storageConfigurationName} />

      <div className="flex justify-end border-slate-100 border-t pt-1">
        <Button
          variant="ghost"
          type="button"
          size="icon"
          className="size-8 text-slate-500 hover:text-blue-600"
          aria-label="编辑环境"
          disabled={!canManageEnvironments}
          onClick={() => onEditEnvironment(environment.id)}
        >
          <Pencil className="size-4" />
        </Button>
      </div>
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

function EmptyState({
  canManageEnvironments,
  onCreateEnvironment,
}: {
  canManageEnvironments: boolean;
  onCreateEnvironment: () => void;
}) {
  return (
    <Card className="items-center rounded-lg border-slate-200 bg-white px-6 py-10 text-center shadow-none">
      <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Server className="size-5" />
      </div>
      <div>
        <div className="font-semibold text-slate-900 text-sm">暂无环境</div>
        <p className="mt-1 text-slate-500 text-sm">创建环境后再关联应用、组合包和发布流程。</p>
      </div>
      <Button
        type="button"
        className="bg-blue-600 hover:bg-blue-700"
        disabled={!canManageEnvironments}
        onClick={onCreateEnvironment}
      >
        <Plus className="size-4" />
        新建环境
      </Button>
    </Card>
  );
}
