import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";

import { navGroups } from "@/app/navigation";
import {
  ApplicationsPage,
  applicationsSnapshotQueryKey,
  fetchApplicationsSnapshot,
} from "@/pages/applications";
import {
  DashboardPage,
  type DashboardSnapshot,
  dashboardSnapshotQueryKey,
  fetchDashboardSnapshot,
} from "@/pages/dashboard";

import { AppSidebar } from "./components/AppSidebar";
import { TopToolbar } from "./components/TopToolbar";
import { useConsoleLayoutStore } from "./model/use-console-layout-store";
import type { NavItem } from "./types";

const emptyDashboardSnapshot: DashboardSnapshot = {
  buildTrend: [],
  metrics: [],
  pipelineRates: [],
  releases: [],
  tasks: [],
  updatedAt: "",
};

const emptyApplicationsSnapshot = {
  applications: [],
  summary: {
    maintenance: 0,
    offline: 0,
    running: 0,
    total: 0,
  },
};

export function ConsoleLayout() {
  const [routePath, setRoutePath] = useState(getCurrentPath);
  const setActiveNavId = useConsoleLayoutStore((state) => state.setActiveNavId);
  const isApplicationsRoute = routePath === "/apps";

  const dashboardQuery = useQuery({
    queryKey: dashboardSnapshotQueryKey,
    queryFn: fetchDashboardSnapshot,
    enabled: !isApplicationsRoute,
    refetchInterval: 18_000,
  });

  const applicationsQuery = useQuery({
    queryKey: applicationsSnapshotQueryKey,
    queryFn: fetchApplicationsSnapshot,
    enabled: isApplicationsRoute,
    refetchInterval: 18_000,
  });

  const activeNav = useMemo(() => findNavItem(routePath) ?? findNavItem("/"), [routePath]);

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

  const handleNavigate = useCallback((item: NavItem) => {
    if (window.location.pathname !== item.href) {
      window.history.pushState(null, "", item.href);
    }

    setRoutePath(normalizePath(item.href));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <AppSidebar navGroups={navGroups} onNavigate={handleNavigate} />

        <section className="min-w-0 flex-1">
          <TopToolbar
            isFetching={
              isApplicationsRoute ? applicationsQuery.isFetching : dashboardQuery.isFetching
            }
            onRefresh={() => {
              if (isApplicationsRoute) {
                void applicationsQuery.refetch();
                return;
              }

              void dashboardQuery.refetch();
            }}
          />

          {isApplicationsRoute ? (
            <ApplicationsPage
              applications={(applicationsQuery.data ?? emptyApplicationsSnapshot).applications}
              isFetching={applicationsQuery.isFetching}
              onRefresh={() => void applicationsQuery.refetch()}
              summary={(applicationsQuery.data ?? emptyApplicationsSnapshot).summary}
            />
          ) : (
            <DashboardPage snapshot={dashboardQuery.data ?? emptyDashboardSnapshot} />
          )}
        </section>
      </div>
    </main>
  );
}

function findNavItem(path: string) {
  return navGroups
    .flatMap((group) => group.items)
    .find((item) => normalizePath(item.href) === path);
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
