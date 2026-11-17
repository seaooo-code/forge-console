import { useQuery } from "@tanstack/react-query";
import { Plus, RotateCw } from "lucide-react";

import { EmptyState } from "@/components/common/StateBlock";
import { DetailList, ErrorMessage, ListHeader, SummaryStats } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

import { environmentsSnapshotQueryKey } from "./api/environment-query-keys";
import { fetchEnvironmentsSnapshot } from "./api/environments-snapshot";
import { environmentDotClass, environmentStatusLabels } from "./constants";
import { EnvironmentFormDrawer } from "./EnvironmentCreatePage";
import type { RuntimeEnvironment } from "./types";

type EnvironmentsPageProps = {
  /** 新建或编辑时在列表之上打开的抽屉；undefined 表示不打开。 */
  drawer?: { mode: "create" } | { mode: "edit"; environmentId: string };
  onCloseDrawer: () => void;
  onCreateEnvironment: () => void;
  onEditEnvironment: (environmentId: string) => void;
};

export function EnvironmentsPage({
  drawer,
  onCloseDrawer,
  onCreateEnvironment,
  onEditEnvironment,
}: EnvironmentsPageProps) {
  const session = useAuthStore((state) => state.session);
  const canManageEnvironments = Boolean(session?.capabilities.canManageEnvironments);
  const {
    data: snapshot,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
  });
  const environments = snapshot?.environments ?? [];
  const grayCount = environments.filter((environment) => environment.status === "gray").length;

  return (
    <div className="flex flex-col gap-5">
      <ListHeader
        title="环境"
        summary={
          <SummaryStats
            items={[
              { id: "total", label: "个环境", value: snapshot ? environments.length : "-" },
              { id: "gray", label: "个灰度中", tone: "warning", value: snapshot ? grayCount : "-" },
            ]}
          />
        }
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="刷新环境列表"
              disabled={isFetching}
              onClick={() => {
                void refetch();
              }}
            >
              <RotateCw className={cn(isFetching && "animate-spin")} />
            </Button>
            <Button type="button" disabled={!canManageEnvironments} onClick={onCreateEnvironment}>
              <Plus />
              新建环境
            </Button>
          </>
        }
      />

      {error && !snapshot ? (
        <ErrorMessage error={error} onRetry={() => void refetch()} />
      ) : !snapshot ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {["one", "two", "three"].map((item) => (
            <div key={item} className="h-40 animate-pulse rounded-xl bg-muted" />
          ))}
        </section>
      ) : environments.length === 0 ? (
        <div className="rounded-xl bg-card p-10 shadow-edge">
          <EmptyState
            title="还没有环境"
            description="新建环境并绑定一个存储配置后，模块就可以向这个环境构建和发布。"
          />
        </div>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {environments.map((environment) => (
            <EnvironmentCard
              key={environment.id}
              canManageEnvironments={canManageEnvironments}
              environment={environment}
              isSelected={drawer?.mode === "edit" && drawer.environmentId === environment.id}
              onEditEnvironment={onEditEnvironment}
            />
          ))}
        </section>
      )}

      {drawer ? (
        <EnvironmentFormDrawer
          key={drawer.mode === "edit" ? drawer.environmentId : "new"}
          environmentId={drawer.mode === "edit" ? drawer.environmentId : undefined}
          mode={drawer.mode}
          onBack={onCloseDrawer}
          onSaved={onCloseDrawer}
        />
      ) : null}
    </div>
  );
}

function EnvironmentCard({
  canManageEnvironments,
  environment,
  isSelected,
  onEditEnvironment,
}: {
  canManageEnvironments: boolean;
  environment: RuntimeEnvironment;
  isSelected: boolean;
  onEditEnvironment: (environmentId: string) => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={!canManageEnvironments}
      onClick={() => onEditEnvironment(environment.id)}
      className={cn(
        "h-auto flex-col items-stretch justify-start gap-4 whitespace-normal rounded-xl bg-card p-5 text-left font-normal shadow-edge hover:bg-card hover:shadow-raise disabled:opacity-100",
        isSelected && "ring-2 ring-primary ring-inset",
      )}
    >
      <span className="flex items-start gap-3">
        <i
          className={cn(
            "mt-1.5 size-2.5 shrink-0 rounded-sm",
            environmentDotClass[environment.tone],
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium text-base text-foreground">
              {environment.name}
            </span>
            <span className="font-mono text-faint text-xs">{environment.id}</span>
          </span>
          <span className="mt-1 line-clamp-2 block text-muted-foreground text-sm">
            {environment.description || "没有描述"}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-0.5 text-xs",
            environment.status === "gray"
              ? "bg-warning/14 text-warning-foreground dark:text-warning"
              : "bg-success/12 text-success",
          )}
        >
          {environmentStatusLabels[environment.status]}
        </span>
      </span>
      <DetailList
        items={[
          { label: "存储配置", value: environment.storageConfigurationName || "未绑定" },
          { label: "更新", value: environment.updatedAt },
        ]}
      />
    </Button>
  );
}
