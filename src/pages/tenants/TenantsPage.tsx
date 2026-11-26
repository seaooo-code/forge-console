import { useQuery } from "@tanstack/react-query";
import { Plus, RotateCw } from "lucide-react";

import { EmptyState } from "@/components/common/StateBlock";
import { DetailList, ErrorMessage, ListHeader, SummaryStats } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/use-auth-store";

import { fetchTenants, tenantsQueryKey } from "./api";
import { tenantStatusLabels } from "./constants";
import { TenantFormDrawer } from "./TenantFormDrawer";
import type { Tenant } from "./types";

type TenantsPageProps = {
  /** 新建或编辑时在列表之上打开的抽屉；undefined 表示不打开。 */
  drawer?: { mode: "create" } | { mode: "edit"; tenantId: string };
  onCloseDrawer: () => void;
  onCreateTenant: () => void;
  onEditTenant: (tenantId: string) => void;
};

export function TenantsPage({
  drawer,
  onCloseDrawer,
  onCreateTenant,
  onEditTenant,
}: TenantsPageProps) {
  const session = useAuthStore((state) => state.session);
  const {
    data: tenants,
    error,
    isFetching,
    refetch,
  } = useQuery({
    queryFn: fetchTenants,
    queryKey: tenantsQueryKey,
  });
  const activeCount = tenants?.filter((tenant) => tenant.status === "active").length;
  const editingTenant =
    drawer?.mode === "edit" ? tenants?.find((tenant) => tenant.id === drawer.tenantId) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <ListHeader
        title="租户"
        summary={
          <SummaryStats
            items={[
              { id: "total", label: "个租户", value: tenants ? tenants.length : "-" },
              { id: "active", label: "个启用中", tone: "success", value: activeCount ?? "-" },
            ]}
          />
        }
        actions={
          <>
            <Button
              variant="outline"
              size="icon"
              aria-label="刷新租户"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              <RotateCw className={cn(isFetching && "animate-spin")} />
            </Button>
            <Button type="button" onClick={onCreateTenant}>
              <Plus />
              新建租户
            </Button>
          </>
        }
      />
      <p className="m-0 text-muted-foreground text-sm">
        登录页列出所有启用中的租户，用户选择后用对应的飞书应用授权。不同租户的账号互不相通：
        同一个人在两个租户下是两个用户，角色和应用成员要分别授予。
      </p>

      {error && !tenants ? (
        <ErrorMessage error={error} onRetry={() => void refetch()} />
      ) : !tenants ? (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {["one", "two"].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-xl bg-muted" />
          ))}
        </section>
      ) : tenants.length === 0 ? (
        <div className="rounded-xl bg-card p-10 shadow-edge">
          <EmptyState title="还没有租户" description="新建租户后，用户就能在登录页选择它登录。" />
        </div>
      ) : (
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {tenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              isCurrent={session?.activeTenant.id === tenant.id}
              isSelected={drawer?.mode === "edit" && drawer.tenantId === tenant.id}
              onEdit={onEditTenant}
              tenant={tenant}
            />
          ))}
        </section>
      )}

      {drawer?.mode === "create" ? <TenantFormDrawer onClose={onCloseDrawer} /> : null}
      {drawer?.mode === "edit" && editingTenant ? (
        <TenantFormDrawer key={editingTenant.id} tenant={editingTenant} onClose={onCloseDrawer} />
      ) : null}
      {drawer?.mode === "edit" && tenants && !editingTenant ? (
        <Alert variant="warning">没有找到租户 {drawer.tenantId}，它可能已被删除或路径无效。</Alert>
      ) : null}
    </div>
  );
}

function TenantCard({
  isCurrent,
  isSelected,
  onEdit,
  tenant,
}: {
  isCurrent: boolean;
  isSelected: boolean;
  onEdit: (tenantId: string) => void;
  tenant: Tenant;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => onEdit(tenant.id)}
      className={cn(
        "h-auto flex-col items-stretch justify-start gap-4 whitespace-normal rounded-xl bg-card p-5 text-left font-normal shadow-edge hover:bg-card hover:shadow-raise",
        isSelected && "ring-2 ring-primary ring-inset",
      )}
    >
      <span className="flex items-start gap-3">
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium text-base text-foreground">{tenant.name}</span>
            <span className="font-mono text-faint text-xs">{tenant.id}</span>
          </span>
          <span className="mt-1 block truncate font-mono text-muted-foreground text-sm">
            {tenant.feishuAppId}
          </span>
        </span>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-0.5 text-xs",
            tenant.status === "active"
              ? "bg-success/12 text-success"
              : "bg-muted text-muted-foreground",
          )}
        >
          {tenantStatusLabels[tenant.status]}
        </span>
      </span>
      <DetailList
        items={[
          { label: "排序", value: String(tenant.sortOrder) },
          { label: "当前登录", value: isCurrent ? "是" : "否" },
          { label: "更新", value: formatDateTime(tenant.updatedAt) },
        ]}
      />
    </Button>
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(date);
}
