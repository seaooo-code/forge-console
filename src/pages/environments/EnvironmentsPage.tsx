import { useQuery } from "@tanstack/react-query";
import { Clock3, Database, type LucideIcon, Pencil, Plus, Server } from "lucide-react";

import { PageHeader } from "@/components/layout";
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
    <div className="flex flex-col gap-6">
      <EnvironmentsHeader />

      <section className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {snapshot.environments.map((environment) => (
          <EnvironmentCard
            key={environment.id}
            canManageEnvironments={canManageEnvironments}
            environment={environment}
            onEditEnvironment={onEditEnvironment}
          />
        ))}
        <CreateEnvironmentCard
          canManageEnvironments={canManageEnvironments}
          onCreateEnvironment={onCreateEnvironment}
        />
      </section>
    </div>
  );
}

function EnvironmentsPageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <EnvironmentsHeader />
      <section className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
        {["one", "two", "three", "four"].map((item) => (
          <Card key={item} className="h-40 animate-pulse rounded-xl bg-card shadow-xs" />
        ))}
      </section>
    </div>
  );
}

function EnvironmentsHeader() {
  return <PageHeader title="环境管理" description="管理运行环境和对应的对象存储配置" />;
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
        "gap-3 rounded-xl border-t-4 px-3.5 py-3.5 shadow-xs",
        environmentToneClass[environment.tone],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Server className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-foreground text-sm leading-5">
              {environment.name}
            </div>
            <p className="mt-0.5 line-clamp-2 text-muted-foreground text-xs leading-4">
              {environment.description}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          type="button"
          size="icon"
          className="-mt-1 size-8 shrink-0 text-muted-foreground hover:text-primary"
          aria-label="编辑环境"
          disabled={!canManageEnvironments}
          onClick={() => onEditEnvironment(environment.id)}
        >
          <Pencil className="size-4" />
        </Button>
      </div>

      <div className="grid gap-1.5 border-border border-t pt-2 text-xs">
        <InfoMetric icon={Clock3} label="更新" value={environment.updatedAt} />
        <InfoMetric icon={Database} label="存储配置" value={environment.storageConfigurationName} />
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
    <div className="flex min-w-0 items-center gap-2">
      <div className="flex shrink-0 items-center gap-1 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <div className="min-w-0 flex-1 truncate text-right font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}

function CreateEnvironmentCard({
  canManageEnvironments,
  onCreateEnvironment,
}: {
  canManageEnvironments: boolean;
  onCreateEnvironment: () => void;
}) {
  return (
    <Card
      className={cn(
        "flex min-h-40 items-center justify-center rounded-xl border-dashed border-border bg-card/70 px-3.5 py-3.5 text-center shadow-xs",
        canManageEnvironments ? "cursor-pointer hover:border-primary/45 hover:bg-card" : "",
      )}
      role="button"
      aria-disabled={!canManageEnvironments}
      tabIndex={canManageEnvironments ? 0 : -1}
      onClick={() => {
        if (canManageEnvironments) {
          onCreateEnvironment();
        }
      }}
      onKeyDown={(event) => {
        if (!canManageEnvironments || (event.key !== "Enter" && event.key !== " ")) {
          return;
        }
        event.preventDefault();
        onCreateEnvironment();
      }}
    >
      <div className="flex flex-col items-center gap-2.5">
        <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Plus className="size-4" />
        </div>
        <div>
          <div className="font-semibold text-foreground text-sm">新建环境</div>
          <p className="mt-1 text-muted-foreground text-xs leading-4">创建运行环境并绑定存储配置</p>
        </div>
      </div>
    </Card>
  );
}
