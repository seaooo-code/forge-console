import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  Boxes,
  Database,
  Gauge,
  GitBranch,
  GitFork,
  History,
  Layers3,
  Moon,
  Package,
  Rocket,
  ServerCog,
  Settings,
  Sun,
  Workflow,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useConsoleLayoutStore } from "../model/use-console-layout-store";
import type { NavGroup, NavIconName, NavItem } from "../types";

const navIcons: Record<NavIconName, LucideIcon> = {
  app: AppWindow,
  build: ServerCog,
  bundle: Package,
  codeSource: GitFork,
  dashboard: Gauge,
  environment: Layers3,
  module: Boxes,
  pipeline: GitBranch,
  release: Rocket,
  releaseRecord: ServerCog,
  rollback: History,
  settings: Settings,
  storage: Database,
  task: Workflow,
};

type AppSidebarProps = {
  navGroups: NavGroup[];
  onNavigate: (item: NavItem) => void;
};

export function AppSidebar({ navGroups, onNavigate }: AppSidebarProps) {
  const activeNavId = useConsoleLayoutStore((state) => state.activeNavId);
  const sidebarTheme = useConsoleLayoutStore((state) => state.sidebarTheme);
  const setActiveNavId = useConsoleLayoutStore((state) => state.setActiveNavId);
  const toggleSidebarTheme = useConsoleLayoutStore((state) => state.toggleSidebarTheme);
  const isLight = sidebarTheme === "light";

  return (
    <aside
      className={cn(
        "flex min-h-screen w-full flex-col lg:sticky lg:top-0 lg:h-screen lg:w-62 lg:shrink-0",
        isLight
          ? "border-slate-200 border-r bg-white text-slate-700"
          : "bg-slate-950 text-slate-300",
      )}
    >
      <div
        className={cn(
          "flex h-18 items-center gap-3 border-b px-5",
          isLight ? "border-slate-200" : "border-slate-800",
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-semibold text-white text-xs">
          RN
        </div>
        <div className="min-w-0">
          <div
            className={cn(
              "truncate font-semibold text-sm",
              isLight ? "text-slate-950" : "text-white",
            )}
          >
            RN Bundle 平台
          </div>
          <div className={cn("truncate text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
            Engineering Console
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <div
              className={cn(
                "px-3 pb-1 font-medium text-xs uppercase tracking-wide",
                isLight ? "text-slate-400" : "text-slate-500",
              )}
            >
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
                    active &&
                      "bg-blue-600 text-white shadow-blue-600/25 shadow-lg hover:bg-blue-600 hover:text-white",
                    !active &&
                      (isLight
                        ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"),
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
                          ? "bg-white/20 text-white"
                          : isLight
                            ? "bg-amber-50 text-amber-700"
                            : "bg-amber-500/15 text-amber-300",
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

      <div
        className={cn(
          "flex items-center justify-between gap-3 border-t px-5 py-3 text-xs",
          isLight ? "border-slate-200 text-slate-500" : "border-slate-800 text-slate-500",
        )}
      >
        <span>v2.8.4 · build 20260609</span>
        <Button
          variant="ghost"
          size="icon"
          type="button"
          className={cn(
            "size-7 rounded-md transition-colors",
            isLight
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white",
          )}
          aria-label={isLight ? "切换为深色侧边栏" : "切换为浅色侧边栏"}
          onClick={toggleSidebarTheme}
        >
          {isLight ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
        </Button>
      </div>
    </aside>
  );
}
