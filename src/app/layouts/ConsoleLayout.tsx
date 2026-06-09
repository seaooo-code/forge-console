import { type QueryKey, useQuery } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";

import { navGroups } from "@/app/navigation";
import {
  ApplicationsPage,
  type ApplicationsSnapshot,
  applicationsSnapshotQueryKey,
  fetchApplicationsSnapshot,
} from "@/pages/applications";
import {
  BundlesPage,
  type BundlesSnapshot,
  bundlesSnapshotQueryKey,
  fetchBundlesSnapshot,
} from "@/pages/bundles";
import {
  CombinationsPage,
  type CombinationsSnapshot,
  combinationsSnapshotQueryKey,
  fetchCombinationsSnapshot,
} from "@/pages/combinations";
import {
  DashboardPage,
  type DashboardSnapshot,
  dashboardSnapshotQueryKey,
  fetchDashboardSnapshot,
} from "@/pages/dashboard";
import {
  DevTasksPage,
  type DevTasksSnapshot,
  devTasksSnapshotQueryKey,
  fetchDevTasksSnapshot,
} from "@/pages/dev-tasks";
import {
  EnvironmentsPage,
  type EnvironmentsSnapshot,
  environmentsSnapshotQueryKey,
  fetchEnvironmentsSnapshot,
} from "@/pages/environments";
import { fetchGraySnapshot, GrayPage, type GraySnapshot, graySnapshotQueryKey } from "@/pages/gray";
import {
  fetchModulesSnapshot,
  ModulesPage,
  type ModulesSnapshot,
  modulesSnapshotQueryKey,
} from "@/pages/modules";
import {
  fetchPipelinesSnapshot,
  PipelinesPage,
  type PipelinesSnapshot,
  pipelinesSnapshotQueryKey,
} from "@/pages/pipelines";
import {
  fetchReleasesSnapshot,
  ReleasesPage,
  type ReleasesSnapshot,
  releasesSnapshotQueryKey,
} from "@/pages/releases";
import {
  fetchRollbackSnapshot,
  RollbackPage,
  type RollbackSnapshot,
  rollbackSnapshotQueryKey,
} from "@/pages/rollback";
import {
  fetchSettingsSnapshot,
  SettingsPage,
  type SettingsSnapshot,
  settingsSnapshotQueryKey,
} from "@/pages/settings";

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

const emptyApplicationsSnapshot: ApplicationsSnapshot = {
  applications: [],
  summary: {
    maintenance: 0,
    offline: 0,
    running: 0,
    total: 0,
  },
};

const emptyEnvironmentsSnapshot: EnvironmentsSnapshot = {
  environments: [],
  matrix: [],
};

const emptyModulesSnapshot: ModulesSnapshot = {
  modules: [],
};

const emptyDevTasksSnapshot: DevTasksSnapshot = {
  featuredTask: {
    id: "",
    members: [],
    pipelineRuns: [],
    relatedModules: [],
    title: "",
  },
  tasks: [],
};

const emptyPipelinesSnapshot: PipelinesSnapshot = {
  currentRun: {
    branch: "",
    duration: "",
    id: "",
    module: "",
    statusText: "",
    steps: [],
  },
  pipelines: [],
};

const emptyBundlesSnapshot: BundlesSnapshot = {
  bundles: [],
};

const emptyCombinationsSnapshot: CombinationsSnapshot = {
  current: {
    bundleCount: 0,
    bundles: [],
    createdAt: "",
    creator: "",
    environmentLabel: "",
    name: "",
    status: "运行中",
  },
  combinations: [],
};

const emptyReleasesSnapshot: ReleasesSnapshot = {
  focus: {
    approvalChannels: "",
    approvalStatus: "",
    combination: "",
    combinationDetail: "",
    environmentDetail: "",
    environmentName: "",
    grayDetail: "",
    grayPercent: 0,
    id: "",
    owner: "",
    plannedAt: "",
    status: "待审批",
    title: "",
    timeline: [],
  },
  releases: [],
};

const emptyGraySnapshot: GraySnapshot = {
  histories: [],
  rollouts: [],
  summary: [],
};

const emptyRollbackSnapshot: RollbackSnapshot = {
  environments: [],
  histories: [],
  impact: {
    affectedUsers: "",
    cdnTraffic: "",
    changes: [],
    downloadSize: "",
    selectedCombination: "",
  },
  records: [],
};

const emptySettingsSnapshot: SettingsSnapshot = {
  cdnConfigs: [],
  members: [],
  navItems: [],
  notifications: [],
  permissions: [],
};

type PageRenderOptions = {
  isFetching: boolean;
  refetch: () => void;
};

type PageRouteConfig = {
  emptyData: unknown;
  queryFn: () => Promise<unknown>;
  queryKey: QueryKey;
  render: (data: unknown, options: PageRenderOptions) => ReactNode;
};

const pageRoutes: Record<string, PageRouteConfig> = {
  "/": {
    emptyData: emptyDashboardSnapshot,
    queryFn: fetchDashboardSnapshot,
    queryKey: dashboardSnapshotQueryKey,
    render: (snapshot) => <DashboardPage snapshot={snapshot as DashboardSnapshot} />,
  },
  "/apps": {
    emptyData: emptyApplicationsSnapshot,
    queryFn: fetchApplicationsSnapshot,
    queryKey: applicationsSnapshotQueryKey,
    render: (snapshot, { isFetching, refetch }) => {
      const applicationsSnapshot = snapshot as ApplicationsSnapshot;

      return (
        <ApplicationsPage
          applications={applicationsSnapshot.applications}
          isFetching={isFetching}
          onRefresh={refetch}
          summary={applicationsSnapshot.summary}
        />
      );
    },
  },
  "/environments": {
    emptyData: emptyEnvironmentsSnapshot,
    queryFn: fetchEnvironmentsSnapshot,
    queryKey: environmentsSnapshotQueryKey,
    render: (snapshot) => <EnvironmentsPage snapshot={snapshot as EnvironmentsSnapshot} />,
  },
  "/modules": {
    emptyData: emptyModulesSnapshot,
    queryFn: fetchModulesSnapshot,
    queryKey: modulesSnapshotQueryKey,
    render: (snapshot) => <ModulesPage snapshot={snapshot as ModulesSnapshot} />,
  },
  "/dev-tasks": {
    emptyData: emptyDevTasksSnapshot,
    queryFn: fetchDevTasksSnapshot,
    queryKey: devTasksSnapshotQueryKey,
    render: (snapshot) => <DevTasksPage snapshot={snapshot as DevTasksSnapshot} />,
  },
  "/pipelines": {
    emptyData: emptyPipelinesSnapshot,
    queryFn: fetchPipelinesSnapshot,
    queryKey: pipelinesSnapshotQueryKey,
    render: (snapshot) => <PipelinesPage snapshot={snapshot as PipelinesSnapshot} />,
  },
  "/bundles": {
    emptyData: emptyBundlesSnapshot,
    queryFn: fetchBundlesSnapshot,
    queryKey: bundlesSnapshotQueryKey,
    render: (snapshot) => <BundlesPage snapshot={snapshot as BundlesSnapshot} />,
  },
  "/combinations": {
    emptyData: emptyCombinationsSnapshot,
    queryFn: fetchCombinationsSnapshot,
    queryKey: combinationsSnapshotQueryKey,
    render: (snapshot) => <CombinationsPage snapshot={snapshot as CombinationsSnapshot} />,
  },
  "/releases": {
    emptyData: emptyReleasesSnapshot,
    queryFn: fetchReleasesSnapshot,
    queryKey: releasesSnapshotQueryKey,
    render: (snapshot) => <ReleasesPage snapshot={snapshot as ReleasesSnapshot} />,
  },
  "/gray": {
    emptyData: emptyGraySnapshot,
    queryFn: fetchGraySnapshot,
    queryKey: graySnapshotQueryKey,
    render: (snapshot) => <GrayPage snapshot={snapshot as GraySnapshot} />,
  },
  "/rollback": {
    emptyData: emptyRollbackSnapshot,
    queryFn: fetchRollbackSnapshot,
    queryKey: rollbackSnapshotQueryKey,
    render: (snapshot) => <RollbackPage snapshot={snapshot as RollbackSnapshot} />,
  },
  "/settings": {
    emptyData: emptySettingsSnapshot,
    queryFn: fetchSettingsSnapshot,
    queryKey: settingsSnapshotQueryKey,
    render: (snapshot) => <SettingsPage snapshot={snapshot as SettingsSnapshot} />,
  },
};

export function ConsoleLayout() {
  const [routePath, setRoutePath] = useState(getCurrentPath);
  const setActiveNavId = useConsoleLayoutStore((state) => state.setActiveNavId);
  const activeNav = useMemo(() => findNavItem(routePath) ?? findNavItem("/"), [routePath]);
  const routeConfig = pageRoutes[routePath] ?? pageRoutes["/"];

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
          <TopToolbar isFetching={isFetching} onRefresh={refetchPage} />

          {routeConfig.render(pageData, {
            isFetching,
            refetch: refetchPage,
          })}
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
