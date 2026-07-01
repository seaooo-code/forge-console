import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  Boxes,
  Database,
  Gauge,
  GitFork,
  KeyRound,
  Layers3,
  ServerCog,
  Settings,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useConsoleLayoutStore } from "../model/use-console-layout-store";
import type { NavGroup, NavIconName, NavItem } from "../types";

const navIcons: Record<NavIconName, LucideIcon> = {
  accessToken: KeyRound,
  app: AppWindow,
  build: ServerCog,
  codeSource: GitFork,
  dashboard: Gauge,
  environment: Layers3,
  module: Boxes,
  releaseRecord: ServerCog,
  settings: Settings,
  storage: Database,
};

type AppSidebarProps = {
  navGroups: NavGroup[];
  onNavigate: (item: NavItem) => void;
};

export function AppSidebar({ navGroups, onNavigate }: AppSidebarProps) {
  const activeNavId = useConsoleLayoutStore((state) => state.activeNavId);
  const setActiveNavId = useConsoleLayoutStore((state) => state.setActiveNavId);

  return (
    <aside className="flex min-h-screen w-full flex-col border-border border-r bg-card text-foreground lg:sticky lg:top-0 lg:h-screen lg:w-62 lg:shrink-0">
      <div className="flex h-18 items-center gap-3 border-border border-b px-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground text-xs">
          RN
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground text-sm">RN Bundle 平台</div>
          <div className="truncate text-muted-foreground text-xs">Engineering Console</div>
        </div>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <div className="px-3 pb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
              {group.label}
            </div>
            {group.items.map((item) => {
              const Icon = navIcons[item.icon];
              const active = activeNavId === item.id;

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  type="button"
                  className={cn(
                    "relative flex h-9 w-full justify-start gap-3 rounded-md px-3 pr-12 text-left font-medium text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary hover:text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                  onClick={() => {
                    setActiveNavId(item.id);
                    onNavigate(item);
                  }}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.isMock ? (
                    <span
                      className={cn(
                        "absolute top-1 right-1.5 rounded px-1.5 py-0.5 font-medium text-[10px] leading-none",
                        active
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-warning/15 text-warning",
                      )}
                      title="暂未接真实接口"
                    >
                      未接
                    </span>
                  ) : null}
                </Button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex items-center justify-between gap-3 border-border border-t px-5 py-3 text-muted-foreground text-xs">
        <span>v2.8.4 · build 20260609</span>
      </div>
    </aside>
  );
}
