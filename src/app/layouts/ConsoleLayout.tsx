import { Suspense, useCallback, useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import { navGroups } from "@/app/navigation";
import { Button } from "@/components/ui/button";
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AppSidebar navGroups={navGroups} onNavigate={handleNavigate} />

        <section className="flex min-w-0 flex-1 flex-col">
          <TopToolbar />

          <div className="flex-1 px-6 py-6 lg:px-8 lg:py-8">
            <Suspense fallback={<PageFallback />}>
              <Outlet />
            </Suspense>
          </div>
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
    <div className="flex flex-col gap-6">
      <Card className="h-22 animate-pulse bg-card shadow-none" />
      <Card className="h-96 animate-pulse bg-card shadow-none" />
    </div>
  );
}

export function ConsoleRouteNotFound() {
  return (
    <>
      <div className="border-border border-b bg-card px-6 py-5">
        <h1 className="font-semibold text-2xl text-foreground tracking-tight">页面不存在</h1>
        <p className="mt-2 text-muted-foreground text-sm">当前路径没有对应页面。</p>
      </div>
      <div className="px-6 py-5">
        <Card className="bg-card p-6 text-muted-foreground text-sm shadow-none">
          请从左侧导航重新选择页面。
        </Card>
        <Button variant="link" type="button" className="mt-3 text-primary">
          返回首页
        </Button>
      </div>
    </>
  );
}
