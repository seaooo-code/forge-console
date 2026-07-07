import { useQuery } from "@tanstack/react-query";
import { Clock3, Database, type LucideIcon, Pencil, Plus, Server } from "lucide-react";
import type { ReactNode } from "react";

import { EmptyState as StateEmptyState } from "@/components/common/StateBlock";
import { PageHeader } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

import { environmentsSnapshotQueryKey } from "./api/environment-query-keys";
import { fetchEnvironmentsSnapshot } from "./api/environments-snapshot";
import { environmentToneClass } from "./constants";
import type { RuntimeEnvironment } from "./types";

const environmentBreadcrumbs = [{ label: "平台" }, { label: "环境管理" }];

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
    <div className="flex flex-col gap-6">
      <EnvironmentsHeader
        actions={
          <Button
            type="button"
            size="sm"
            disabled={!canManageEnvironments}
            onClick={onCreateEnvironment}
          >
            <Plus className="size-4" />
            新建环境
          </Button>
        }
      />

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
  );
}

function EnvironmentsPageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <EnvironmentsHeader />
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {["one", "two", "three", "four"].map((item) => (
          <Card key={item} className="h-52 animate-pulse rounded-xl bg-card shadow-xs" />
        ))}
      </section>
    </div>
  );
}

function EnvironmentsHeader({ actions }: { actions?: ReactNode }) {
  return (
    <PageHeader
      breadcrumbs={environmentBreadcrumbs}
      title="环境管理"
      description="管理运行环境和对应的对象存储配置"
      actions={actions}
    />
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
        "gap-4 rounded-xl border-t-4 px-4 py-4 shadow-xs",
        environmentToneClass[environment.tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Server className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground text-sm">{environment.name}</div>
          </div>
        </div>
      </div>

      <p className="min-h-10 text-muted-foreground text-sm leading-5">{environment.description}</p>

      <InfoMetric icon={Clock3} label="更新" value={environment.updatedAt} />

      <InfoMetric icon={Database} label="存储配置" value={environment.storageConfigurationName} />

      <div className="flex justify-end border-border border-t pt-1">
        <Button
          variant="ghost"
          type="button"
          size="icon"
          className="size-8 text-muted-foreground hover:text-primary"
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
      <div className="flex items-center gap-1 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <div className="truncate font-semibold text-foreground">{value}</div>
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
    <StateEmptyState
      icon={Server}
      title="暂无环境"
      description="创建环境后再关联应用、组合包和发布流程。"
      className="border-border bg-card"
      action={
        <Button
          type="button"
          className="bg-primary hover:bg-primary/90"
          disabled={!canManageEnvironments}
          onClick={onCreateEnvironment}
        >
          <Plus className="size-4" />
          新建环境
        </Button>
      }
    />
  );
}
