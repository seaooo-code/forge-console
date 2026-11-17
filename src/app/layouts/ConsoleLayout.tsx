import { Suspense, useCallback, useEffect, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";

import { navGroups } from "@/app/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { AppSidebar } from "./components/AppSidebar";
import { useConsoleLayoutStore } from "./model/use-console-layout-store";
import type { NavItem } from "./types";

/** 这些页面自己排布多块画布（列表 + 详情面板），外框不再包一层画布。 */
const isFullBleedPath = (path: string) =>
  path === "/" || /^\/(builds|release-records)(\/|$)/.test(path);

export function ConsoleLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const setActiveNavId = useConsoleLayoutStore((state) => state.setActiveNavId);
  const activeNav = useMemo(() => findNavItem(location.pathname), [location.pathname]);
  const fullBleed = isFullBleedPath(location.pathname);

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
    <main className="min-h-screen bg-shell text-foreground">
      <div className="flex min-h-screen flex-col lg:h-screen lg:flex-row">
        <AppSidebar navGroups={navGroups} onNavigate={handleNavigate} />

        <div className={cn("flex min-h-0 min-w-0 flex-1 p-2 lg:pl-0", fullBleed && "gap-2")}>
          {fullBleed ? (
            <Suspense fallback={<CanvasFallback />}>
              <Outlet />
            </Suspense>
          ) : (
            <section className="min-h-0 min-w-0 flex-1 overflow-y-auto rounded-xl bg-background shadow-edge">
              <div className="px-6 py-6 lg:px-8 lg:py-7">
                <Suspense fallback={<PageFallback />}>
                  <Outlet />
                </Suspense>
              </div>
            </section>
          )}
        </div>
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

function CanvasFallback() {
  return <section className="min-w-0 flex-1 animate-pulse rounded-xl bg-background shadow-edge" />;
}

function PageFallback() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="h-22 animate-pulse bg-muted shadow-none" />
      <Card className="h-96 animate-pulse bg-muted shadow-none" />
    </div>
  );
}

export function ConsoleRouteNotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-start gap-2 py-10">
      <h1 className="font-semibold text-2xl text-foreground tracking-tight">页面不存在</h1>
      <p className="text-muted-foreground text-sm">当前路径没有对应页面，请从左侧导航重新选择。</p>
      <Button variant="outline" type="button" className="mt-3" onClick={() => navigate("/")}>
        返回线上现状
      </Button>
    </div>
  );
}
