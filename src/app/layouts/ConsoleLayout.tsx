import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { navGroups } from "@/app/navigation";
import { Card } from "@/components/ui/card";
import { emptyApplicationListFilters, getApplicationRouteConfig } from "@/pages/applications";
import { getBundlesRouteConfig } from "@/pages/bundles";
import { getCombinationsRouteConfig } from "@/pages/combinations";
import { getDashboardRouteConfig } from "@/pages/dashboard";
import { getDevTasksRouteConfig } from "@/pages/dev-tasks";
import { getEnvironmentRouteConfig } from "@/pages/environments";
import { getGrayRouteConfig } from "@/pages/gray";
import { getModulesRouteConfig } from "@/pages/modules";
import { getPipelinesRouteConfig } from "@/pages/pipelines";
import { getReleasesRouteConfig } from "@/pages/releases";
import { getRollbackRouteConfig } from "@/pages/rollback";
import { getSettingsRouteConfig } from "@/pages/settings";
import { getStorageRouteConfig } from "@/pages/storage";
import type { PageRenderOptions, PageRouteConfig } from "@/types/page-route";

import { AppSidebar } from "./components/AppSidebar";
import { TopToolbar } from "./components/TopToolbar";
import { useConsoleLayoutStore } from "./model/use-console-layout-store";
import type { NavItem } from "./types";

function getRouteConfig(
  path: string,
  applicationFilters: typeof emptyApplicationListFilters,
  onApplicationsChanged: () => Promise<void>,
  onEnvironmentsChanged: () => Promise<void>,
  onStorageChanged: () => Promise<void>,
  onApplicationFiltersChange: (filters: typeof emptyApplicationListFilters) => void,
): PageRouteConfig {
  const routeConfig =
    getApplicationRouteConfig({
      applicationFilters,
      onApplicationFiltersChange,
      onApplicationsChanged,
      path,
    }) ??
    getEnvironmentRouteConfig({ onEnvironmentsChanged, path }) ??
    getStorageRouteConfig({ onStorageChanged, path }) ??
    getDashboardRouteConfig(path) ??
    getModulesRouteConfig(path) ??
    getDevTasksRouteConfig(path) ??
    getPipelinesRouteConfig(path) ??
    getBundlesRouteConfig(path) ??
    getCombinationsRouteConfig(path) ??
    getReleasesRouteConfig(path) ??
    getGrayRouteConfig(path) ??
    getRollbackRouteConfig(path) ??
    getSettingsRouteConfig(path);

  if (routeConfig) {
    return routeConfig;
  }

  const fallbackRouteConfig = getDashboardRouteConfig("/");

  if (!fallbackRouteConfig) {
    throw new Error("Dashboard route config is missing");
  }

  return fallbackRouteConfig;
}

export function ConsoleLayout() {
  const queryClient = useQueryClient();
  const [routePath, setRoutePath] = useState(getCurrentPath);
  const [applicationFilters, setApplicationFilters] = useState(emptyApplicationListFilters);
  const setActiveNavId = useConsoleLayoutStore((state) => state.setActiveNavId);
  const activeNav = useMemo(() => findNavItem(routePath) ?? findNavItem("/"), [routePath]);
  const handleApplicationsChanged = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["applications-snapshot"] }),
    [queryClient],
  );
  const handleEnvironmentsChanged = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["environments"] }),
    [queryClient],
  );
  const handleStorageChanged = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["storage-snapshot"] }),
    [queryClient],
  );
  const routeConfig = useMemo(
    () =>
      getRouteConfig(
        routePath,
        applicationFilters,
        handleApplicationsChanged,
        handleEnvironmentsChanged,
        handleStorageChanged,
        setApplicationFilters,
      ),
    [
      applicationFilters,
      handleApplicationsChanged,
      handleEnvironmentsChanged,
      handleStorageChanged,
      routePath,
    ],
  );

  const { data, isFetching, refetch } = useQuery({
    queryKey: routeConfig.queryKey,
    queryFn: routeConfig.queryFn,
    refetchInterval: 18_000,
  });

  const pageData = data ?? routeConfig.emptyData;
  const refetchPage = useCallback(() => void refetch(), [refetch]);

  useEffect(() => {
    const handlePopstate = () => setRoutePath(getCurrentPath());

    window.addEventListener("popstate", handlePopstate);

    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  useEffect(() => {
    if (!activeNav) {
      return;
    }

    setActiveNavId(activeNav.id);
    document.title = `${activeNav.label} · RN Bundle 平台`;
  }, [activeNav, setActiveNavId]);

  const handleNavigatePath = useCallback((path: string) => {
    const normalizedPath = normalizePath(path);

    if (window.location.pathname !== normalizedPath) {
      window.history.pushState(null, "", normalizedPath);
    }

    setRoutePath(normalizedPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  const handleNavigate = useCallback(
    (item: NavItem) => {
      handleNavigatePath(item.href);
    },
    [handleNavigatePath],
  );

  const renderOptions = useMemo<PageRenderOptions>(
    () => ({
      isFetching,
      navigateTo: handleNavigatePath,
      refetch: refetchPage,
    }),
    [handleNavigatePath, isFetching, refetchPage],
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AppSidebar navGroups={navGroups} onNavigate={handleNavigate} />

        <section className="min-w-0 flex-1">
          <TopToolbar isFetching={isFetching} onRefresh={refetchPage} />

          <Suspense fallback={<PageFallback />}>
            {routeConfig.render(pageData, renderOptions)}
          </Suspense>
        </section>
      </div>
    </main>
  );
}

function findNavItem(path: string) {
  const navItems = navGroups.flatMap((group) => group.items);
  const normalizedPath = normalizePath(path);
  const exactItem = navItems.find((item) => normalizePath(item.href) === normalizedPath);

  if (exactItem) {
    return exactItem;
  }

  return navItems.find((item) => {
    const href = normalizePath(item.href);

    return href !== "/" && normalizedPath.startsWith(`${href}/`);
  });
}

function getCurrentPath() {
  return normalizePath(window.location.pathname);
}

function normalizePath(path: string) {
  if (path === "") {
    return "/";
  }

  return path.replace(/\/+$/, "") || "/";
}

function PageFallback() {
  return (
    <div className="space-y-4 px-6 py-5">
      <Card className="h-22 animate-pulse rounded-lg border-slate-200 bg-white shadow-none" />
      <Card className="h-96 animate-pulse rounded-lg border-slate-200 bg-white shadow-none" />
    </div>
  );
}
