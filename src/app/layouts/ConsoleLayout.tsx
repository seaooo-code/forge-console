import { Suspense, useCallback, useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import { navGroups } from "@/app/navigation";
import { Card } from "@/components/ui/card";

import { AppSidebar } from "./components/AppSidebar";
import { TopToolbar } from "./components/TopToolbar";
import { useConsoleLayoutStore } from "./model/use-console-layout-store";
import type { NavItem } from "./types";

export function ConsoleLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const setActiveNavId = useConsoleLayoutStore((state) => state.setActiveNavId);
  const activeNav = useMemo(() => findNavItem(location.pathname), [location.pathname]);

  useEffect(() => {
    if (activeNav) {
      setActiveNavId(activeNav.id);
      document.title = `${activeNav.label} · RN Bundle 平台`;
    } else {
      setActiveNavId("");
      document.title = "页面不存在 · RN Bundle 平台";
    }
  }, [activeNav, setActiveNavId]);

  const handleNavigate = useCallback(
    (item: NavItem) => {
      navigate(item.href);
    },
    [navigate],
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AppSidebar navGroups={navGroups} onNavigate={handleNavigate} />

        <section className="min-w-0 flex-1">
          <TopToolbar />

          <Suspense fallback={<PageFallback />}>
            <Outlet />
          </Suspense>
        </section>
      </div>
    </main>
  );
}

function findNavItem(path: string) {
  const navItems = navGroups.flatMap((group) => group.items);
  const exactItem = navItems.find((item) => item.href === path);

  if (exactItem) {
    return exactItem;
  }

  return navItems.find((item) => {
    const href = item.href;

    return href !== "/" && path.startsWith(`${href}/`);
  });
}

function PageFallback() {
  return (
    <div className="space-y-4 px-6 py-5">
      <Card className="h-22 animate-pulse rounded-lg border-slate-200 bg-white shadow-none" />
      <Card className="h-96 animate-pulse rounded-lg border-slate-200 bg-white shadow-none" />
    </div>
  );
}

export function ConsoleRouteNotFound() {
  return (
    <>
      <div className="border-slate-200 border-b bg-white px-6 py-5">
        <h1 className="font-semibold text-2xl text-slate-950 tracking-tight">页面不存在</h1>
        <p className="mt-2 text-slate-600 text-sm">当前路径没有对应页面。</p>
      </div>
      <div className="px-6 py-5">
        <Card className="rounded-lg border-slate-200 bg-white p-6 text-slate-600 text-sm shadow-none">
          请从左侧导航重新选择页面。
        </Card>
      </div>
    </>
  );
}
