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
    <aside className="flex h-full w-full flex-col border-border border-r bg-card text-foreground lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
      <div className="flex h-14 items-center gap-3 border-border border-b px-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground text-sm ring-1 ring-inset ring-primary/30">
          RN
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground text-sm">RN Bundle 平台</div>
          <div className="truncate text-muted-foreground text-xs">Engineering Console</div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <div className="px-3 font-medium text-[11px] text-muted-foreground/70 uppercase tracking-wider">
              {group.label}
            </div>
            {group.items.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                active={activeNavId === item.id}
                icon={navIcons[item.icon]}
                onClick={() => {
                  setActiveNavId(item.id);
                  onNavigate(item);
                }}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-border border-t px-4 py-3">
        <div className="text-center text-[10px] text-muted-foreground/70">
          v2.8.4 · build 20260609
        </div>
      </div>
    </aside>
  );
}

type NavLinkProps = {
  active: boolean;
  icon: LucideIcon;
  item: NavItem;
  onClick: () => void;
};

function NavLink({ active, icon: Icon, item, onClick }: NavLinkProps) {
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative h-10 w-full justify-start gap-3 overflow-hidden rounded-lg px-3 text-left transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {/* Active indicator: 3px solid bar on the left edge */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1.5 bottom-1.5 left-0 w-0.75 rounded-full transition-all",
          active ? "bg-primary" : "bg-transparent",
        )}
      />
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md transition-colors",
          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate font-medium text-sm">{item.label}</span>
      </span>
      {item.isMock ? (
        <span
          className={cn(
            "shrink-0 rounded px-1.5 py-0.5 font-medium text-[10px] leading-none",
            active ? "bg-primary/15 text-primary" : "bg-warning/15 text-warning",
          )}
          title="暂未接真实接口"
        >
          未接
        </span>
      ) : null}
      {item.meta ? (
        <span
          className={cn(
            "shrink-0 rounded-md px-1.5 py-0.5 font-medium text-[11px] tabular-nums leading-none",
            active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {item.meta}
        </span>
      ) : null}
    </Button>
  );
}
