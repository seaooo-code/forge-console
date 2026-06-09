import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  Boxes,
  Gauge,
  GitBranch,
  History,
  Layers3,
  Moon,
  Package,
  Rocket,
  Settings,
  Sun,
  Workflow,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { useConsoleStore } from "../model/use-console-store";
import type { NavGroup, NavIconName } from "../types";

const navIcons: Record<NavIconName, LucideIcon> = {
  app: AppWindow,
  bundle: Package,
  dashboard: Gauge,
  environment: Layers3,
  module: Boxes,
  pipeline: GitBranch,
  release: Rocket,
  rollback: History,
  settings: Settings,
  task: Workflow,
};

type AppSidebarProps = {
  navGroups: NavGroup[];
};

export function AppSidebar({ navGroups }: AppSidebarProps) {
  const activeNavId = useConsoleStore((state) => state.activeNavId);
  const sidebarTheme = useConsoleStore((state) => state.sidebarTheme);
  const setActiveNavId = useConsoleStore((state) => state.setActiveNavId);
  const toggleSidebarTheme = useConsoleStore((state) => state.toggleSidebarTheme);
  const isLight = sidebarTheme === "light";

  return (
    <aside
      className={cn(
        "flex min-h-screen w-full flex-col lg:sticky lg:top-0 lg:h-screen",
        isLight
          ? "border-slate-200 border-r bg-white text-slate-700"
          : "bg-[#071120] text-slate-300",
      )}
    >
      <div
        className={cn(
          "flex h-[72px] items-center gap-3 border-b px-5",
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
          <div
            className={cn("truncate text-[11px]", isLight ? "text-slate-500" : "text-slate-400")}
          >
            Engineering Console
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-0.5">
            <div
              className={cn(
                "px-3 pb-1 font-medium text-[10px] uppercase tracking-wide",
                isLight ? "text-slate-400" : "text-slate-500",
              )}
            >
              {group.label}
            </div>
            {group.items.map((item) => {
              const Icon = navIcons[item.icon];
              const active = activeNavId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    "flex h-9 w-full items-center gap-3 rounded-md px-3 text-left font-medium text-sm transition-colors",
                    active && "bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)]",
                    !active &&
                      (isLight
                        ? "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                        : "text-slate-300 hover:bg-slate-800/80 hover:text-white"),
                  )}
                  onClick={() => setActiveNavId(item.id)}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div
        className={cn(
          "flex items-center justify-between gap-3 border-t px-5 py-3 text-[11px]",
          isLight ? "border-slate-200 text-slate-500" : "border-slate-800 text-slate-500",
        )}
      >
        <span>v2.8.4 · build 20260609</span>
        <button
          type="button"
          className={cn(
            "flex size-7 items-center justify-center rounded-md transition-colors",
            isLight
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white",
          )}
          aria-label={isLight ? "切换为深色侧边栏" : "切换为浅色侧边栏"}
          onClick={toggleSidebarTheme}
        >
          {isLight ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
        </button>
      </div>
    </aside>
  );
}
