import { useQuery } from "@tanstack/react-query";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { Bell, ChevronRight, type LucideIcon, Server, UserCog } from "lucide-react";
import { Fragment, type ReactNode, useMemo } from "react";
import { consoleGridTheme } from "@/components/common/console-grid-theme";
import { EnvironmentBadge } from "@/components/common/EnvironmentBadge";
import { MockCard as Card, MockSurface } from "@/components/common/MockSurface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { fetchSettingsSnapshot } from "./api/settings-snapshot";
import { navIconMap, statusClass } from "./constants";
import type {
  CdnConfigRecord,
  MemberRecord,
  MemberStatus,
  NotificationChannelRecord,
  PermissionMatrixRecord,
  SettingsNavItem,
} from "./types";

export function SettingsPage() {
  const { data: snapshot } = useQuery({
    queryFn: fetchSettingsSnapshot,
    queryKey: ["settings-snapshot"],
  });
  const memberColumnDefs = useMemo<ColDef<MemberRecord>[]>(
    () => [
      {
        cellRenderer: MemberCell,
        field: "name",
        flex: 1.1,
        headerName: "成员",
        minWidth: 154,
      },
      {
        field: "email",
        flex: 1.35,
        headerName: "邮箱",
        minWidth: 190,
      },
      {
        cellRenderer: RoleCell,
        field: "role",
        flex: 0.9,
        headerName: "角色",
        minWidth: 116,
      },
      {
        field: "team",
        flex: 1.2,
        headerName: "归属团队",
        minWidth: 168,
      },
      {
        field: "lastActive",
        flex: 0.75,
        headerName: "最近活跃",
        minWidth: 104,
      },
      {
        cellRenderer: StatusCell,
        field: "status",
        flex: 0.55,
        headerName: "状态",
        minWidth: 82,
      },
      {
        cellRenderer: MemberActionsCell,
        colId: "actions",
        flex: 0.65,
        headerName: "操作",
        minWidth: 92,
      },
    ],
    [],
  );

  const permissionColumnDefs = useMemo<ColDef<PermissionMatrixRecord>[]>(
    () => [
      {
        field: "permission",
        flex: 1.35,
        headerName: "权限",
        minWidth: 190,
      },
      {
        cellRenderer: PermissionCell,
        field: "superAdmin",
        flex: 0.8,
        headerName: "超级管理员",
        minWidth: 118,
      },
      {
        cellRenderer: PermissionCell,
        field: "platformAdmin",
        flex: 0.8,
        headerName: "平台管理员",
        minWidth: 118,
      },
      {
        cellRenderer: PermissionCell,
        field: "releaseAdmin",
        flex: 0.8,
        headerName: "发布管理员",
        minWidth: 118,
      },
      {
        cellRenderer: PermissionCell,
        field: "developer",
        flex: 0.62,
        headerName: "开发者",
        minWidth: 88,
      },
      {
        cellRenderer: PermissionCell,
        field: "tester",
        flex: 0.55,
        headerName: "测试",
        minWidth: 76,
      },
      {
        cellRenderer: PermissionCell,
        field: "readonly",
        flex: 0.55,
        headerName: "只读",
        minWidth: 76,
      },
    ],
    [],
  );

  const memberDefaultColDef = useMemo<ColDef<MemberRecord>>(
    () => ({
      cellClass: "flex items-center",
      cellStyle: {
        alignItems: "center",
        display: "flex",
      },
      resizable: false,
      sortable: false,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
    }),
    [],
  );

  const permissionDefaultColDef = useMemo<ColDef<PermissionMatrixRecord>>(
    () => ({
      cellClass: "flex items-center",
      cellStyle: {
        alignItems: "center",
        display: "flex",
      },
      resizable: false,
      sortable: false,
      suppressHeaderMenuButton: true,
      suppressMovable: true,
    }),
    [],
  );

  if (!snapshot) {
    return null;
  }

  return (
    <>
      <div className="border-border border-b bg-card px-6 py-5">
        <div>
          <h1 className="font-semibold text-2xl text-foreground tracking-tight">系统设置</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            平台级配置 · 用户、权限、模板、存储、签名、通知
          </p>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-5 xl:grid-cols-12">
        <aside className="xl:col-span-3">
          <Card className="gap-0 rounded-lg p-0 shadow-none">
            <div className="divide-y divide-border">
              {snapshot.navItems.map((item, index) => (
                <SettingsNavButton key={item.id} item={item} active={index === 0} />
              ))}
            </div>
          </Card>
        </aside>

        <div className="space-y-4 xl:col-span-9">
          <MockSurface
            as="section"
            className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
          >
            <div className="flex h-12 items-center justify-between border-border border-b px-4">
              <h2 className="font-semibold text-foreground text-sm">用户管理 · 成员列表</h2>
              <Button variant="link" type="button" className="h-auto p-0 text-primary text-xs">
                邀请成员
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
            <AgGridReact<MemberRecord>
              rowData={snapshot.members}
              columnDefs={memberColumnDefs}
              defaultColDef={memberDefaultColDef}
              domLayout="autoHeight"
              headerHeight={44}
              rowHeight={58}
              theme={consoleGridTheme}
              suppressCellFocus
              suppressContextMenu
              getRowId={({ data }) => data.id}
            />
          </MockSurface>

          <MockSurface
            as="section"
            className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
          >
            <div className="flex h-12 items-center border-border border-b px-4">
              <h2 className="font-semibold text-foreground text-sm">角色权限矩阵</h2>
            </div>
            <AgGridReact<PermissionMatrixRecord>
              rowData={snapshot.permissions}
              columnDefs={permissionColumnDefs}
              defaultColDef={permissionDefaultColDef}
              domLayout="autoHeight"
              headerHeight={44}
              rowHeight={42}
              theme={consoleGridTheme}
              suppressCellFocus
              suppressContextMenu
              getRowId={({ data }) => data.id}
            />
          </MockSurface>

          <section className="grid gap-4 xl:grid-cols-2">
            <ConfigPanel
              title="CDN 配置"
              icon={Server}
              items={snapshot.cdnConfigs}
              renderItem={(item) => <CdnConfigItem config={item} />}
            />
            <ConfigPanel
              title="通知渠道"
              icon={Bell}
              items={snapshot.notifications}
              renderItem={(item) => <NotificationItem notification={item} />}
            />
          </section>
        </div>
      </div>
    </>
  );
}

function SettingsNavButton({ active, item }: { active: boolean; item: SettingsNavItem }) {
  const Icon = navIconMap[item.id] ?? UserCog;

  return (
    <Button
      variant="ghost"
      type="button"
      className={cn(
        "h-12 w-full justify-between rounded-none px-4 text-foreground hover:bg-primary/10 hover:text-primary",
        active ? "border-primary border-l-2 bg-primary/10 text-primary" : "",
      )}
    >
      <span className="flex items-center gap-3">
        <Icon className="size-4" />
        <span className="font-semibold text-sm">{item.label}</span>
      </span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Button>
  );
}

function MemberCell({ data }: ICellRendererParams<MemberRecord>) {
  if (!data) {
    return null;
  }

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
        {data.avatar}
      </span>
      <span className="truncate font-semibold text-foreground text-sm">{data.name}</span>
    </div>
  );
}

function RoleCell({ value }: ICellRendererParams<MemberRecord, string>) {
  if (!value) {
    return null;
  }

  const isAdmin = value.includes("管理员");

  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded border px-2 font-semibold text-xs leading-none",
        isAdmin
          ? "border-info/30 bg-info/10 text-info"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {value}
    </span>
  );
}

function StatusCell({ value }: ICellRendererParams<MemberRecord, MemberStatus>) {
  if (!value) {
    return null;
  }

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded border px-2 font-semibold text-xs leading-none",
        statusClass[value],
      )}
    >
      {value}
    </span>
  );
}

function MemberActionsCell() {
  return (
    <div className="flex h-full items-center gap-2 whitespace-nowrap font-medium text-primary text-xs">
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-primary text-xs hover:text-primary/80"
      >
        编辑
      </Button>
      <span className="text-muted-foreground">|</span>
      <Button
        variant="link"
        type="button"
        className="h-auto p-0 text-primary text-xs hover:text-primary/80"
      >
        权限
      </Button>
    </div>
  );
}

function PermissionCell({ value }: ICellRendererParams<PermissionMatrixRecord, boolean>) {
  return (
    <div className="flex w-full justify-center">
      {value ? (
        <span className="flex size-5 items-center justify-center rounded-full bg-success/10 font-semibold text-success text-xs">
          ✓
        </span>
      ) : (
        <span className="font-semibold text-muted-foreground text-sm">—</span>
      )}
    </div>
  );
}

type ConfigPanelProps<TItem> = {
  icon: LucideIcon;
  items: TItem[];
  renderItem: (item: TItem) => ReactNode;
  title: string;
};

function ConfigPanel<TItem extends { id: string }>({
  icon: Icon,
  items,
  renderItem,
  title,
}: ConfigPanelProps<TItem>) {
  return (
    <Card className="gap-0 rounded-lg p-0 shadow-none">
      <div className="flex h-12 items-center gap-2 border-border border-b px-4">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="font-semibold text-foreground text-sm">{title}</h2>
      </div>
      <div className="divide-y divide-border px-4 py-2">
        {items.map((item) => (
          <Fragment key={item.id}>{renderItem(item)}</Fragment>
        ))}
      </div>
    </Card>
  );
}

function CdnConfigItem({ config }: { config: CdnConfigRecord }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="truncate font-mono font-semibold text-foreground text-sm">
          {config.domain}
        </div>
        <div className="mt-1 text-muted-foreground text-xs">命中率 {config.hitRate}</div>
      </div>
      <EnvironmentBadge className="shrink-0" environment={config.environment} />
    </div>
  );
}

function NotificationItem({ notification }: { notification: NotificationChannelRecord }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="font-medium text-muted-foreground text-sm">{notification.label}</div>
      <div className="min-w-0 truncate text-right font-mono font-semibold text-foreground text-xs">
        {notification.value}
      </div>
    </div>
  );
}
