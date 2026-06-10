import { type QueryKey, useQuery } from "@tanstack/react-query";
import {
  type ComponentType,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { navGroups } from "@/app/navigation";
import { Card } from "@/components/ui/card";

import { AppSidebar } from "./components/AppSidebar";
import { TopToolbar } from "./components/TopToolbar";
import { useConsoleLayoutStore } from "./model/use-console-layout-store";
import type { NavItem } from "./types";

type AnyPage = ComponentType<Record<string, unknown>>;

const DashboardPage = lazy(async () => ({
  default: (await import("@/pages/dashboard/DashboardPage")).DashboardPage as unknown as AnyPage,
}));

const ApplicationsPage = lazy(async () => ({
  default: (await import("@/pages/applications/ApplicationsPage"))
    .ApplicationsPage as unknown as AnyPage,
}));

const EnvironmentsPage = lazy(async () => ({
  default: (await import("@/pages/environments/EnvironmentsPage"))
    .EnvironmentsPage as unknown as AnyPage,
}));

const ModulesPage = lazy(async () => ({
  default: (await import("@/pages/modules/ModulesPage")).ModulesPage as unknown as AnyPage,
}));

const DevTasksPage = lazy(async () => ({
  default: (await import("@/pages/dev-tasks/DevTasksPage")).DevTasksPage as unknown as AnyPage,
}));

const PipelinesPage = lazy(async () => ({
  default: (await import("@/pages/pipelines/PipelinesPage")).PipelinesPage as unknown as AnyPage,
}));

const BundlesPage = lazy(async () => ({
  default: (await import("@/pages/bundles/BundlesPage")).BundlesPage as unknown as AnyPage,
}));

const CombinationsPage = lazy(async () => ({
  default: (await import("@/pages/combinations/CombinationsPage"))
    .CombinationsPage as unknown as AnyPage,
}));

const ReleasesPage = lazy(async () => ({
  default: (await import("@/pages/releases/ReleasesPage")).ReleasesPage as unknown as AnyPage,
}));

const GrayPage = lazy(async () => ({
  default: (await import("@/pages/gray/GrayPage")).GrayPage as unknown as AnyPage,
}));

const RollbackPage = lazy(async () => ({
  default: (await import("@/pages/rollback/RollbackPage")).RollbackPage as unknown as AnyPage,
}));

const SettingsPage = lazy(async () => ({
  default: (await import("@/pages/settings/SettingsPage")).SettingsPage as unknown as AnyPage,
}));

const emptyDashboardSnapshot = {
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

const emptyEnvironmentsSnapshot = {
  environments: [],
  matrix: [],
};

const emptyModulesSnapshot = {
  modules: [],
};

const emptyDevTasksSnapshot = {
  featuredTask: {
    id: "",
    members: [],
    pipelineRuns: [],
    relatedModules: [],
    title: "",
  },
  tasks: [],
};

const emptyPipelinesSnapshot = {
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

const emptyBundlesSnapshot = {
  bundles: [],
};

const emptyCombinationsSnapshot = {
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

const emptyReleasesSnapshot = {
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

const emptyGraySnapshot = {
  histories: [],
  rollouts: [],
  summary: [],
};

const emptyRollbackSnapshot = {
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

const emptySettingsSnapshot = {
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
    queryFn: async () =>
      (await import("@/pages/dashboard/api/dashboard-snapshot")).fetchDashboardSnapshot(),
    queryKey: ["dashboard-snapshot"],
    render: (snapshot) => <DashboardPage snapshot={snapshot} />,
  },
  "/apps": {
    emptyData: emptyApplicationsSnapshot,
    queryFn: async () =>
      (await import("@/pages/applications/api/applications-snapshot")).fetchApplicationsSnapshot(),
    queryKey: ["applications-snapshot"],
    render: (snapshot, { isFetching, refetch }) => {
      const applicationsSnapshot = snapshot as typeof emptyApplicationsSnapshot;

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
    queryFn: async () =>
      (await import("@/pages/environments/api/environments-snapshot")).fetchEnvironmentsSnapshot(),
    queryKey: ["environments-snapshot"],
    render: (snapshot) => <EnvironmentsPage snapshot={snapshot} />,
  },
  "/modules": {
    emptyData: emptyModulesSnapshot,
    queryFn: async () =>
      (await import("@/pages/modules/api/modules-snapshot")).fetchModulesSnapshot(),
    queryKey: ["modules-snapshot"],
    render: (snapshot) => <ModulesPage snapshot={snapshot} />,
  },
  "/dev-tasks": {
    emptyData: emptyDevTasksSnapshot,
    queryFn: async () =>
      (await import("@/pages/dev-tasks/api/dev-tasks-snapshot")).fetchDevTasksSnapshot(),
    queryKey: ["dev-tasks-snapshot"],
    render: (snapshot) => <DevTasksPage snapshot={snapshot} />,
  },
  "/pipelines": {
    emptyData: emptyPipelinesSnapshot,
    queryFn: async () =>
      (await import("@/pages/pipelines/api/pipelines-snapshot")).fetchPipelinesSnapshot(),
    queryKey: ["pipelines-snapshot"],
    render: (snapshot) => <PipelinesPage snapshot={snapshot} />,
  },
  "/bundles": {
    emptyData: emptyBundlesSnapshot,
    queryFn: async () =>
      (await import("@/pages/bundles/api/bundles-snapshot")).fetchBundlesSnapshot(),
    queryKey: ["bundles-snapshot"],
    render: (snapshot) => <BundlesPage snapshot={snapshot} />,
  },
  "/combinations": {
    emptyData: emptyCombinationsSnapshot,
    queryFn: async () =>
      (await import("@/pages/combinations/api/combinations-snapshot")).fetchCombinationsSnapshot(),
    queryKey: ["combinations-snapshot"],
    render: (snapshot) => <CombinationsPage snapshot={snapshot} />,
  },
  "/releases": {
    emptyData: emptyReleasesSnapshot,
    queryFn: async () =>
      (await import("@/pages/releases/api/releases-snapshot")).fetchReleasesSnapshot(),
    queryKey: ["releases-snapshot"],
    render: (snapshot) => <ReleasesPage snapshot={snapshot} />,
  },
  "/gray": {
    emptyData: emptyGraySnapshot,
    queryFn: async () => (await import("@/pages/gray/api/gray-snapshot")).fetchGraySnapshot(),
    queryKey: ["gray-snapshot"],
    render: (snapshot) => <GrayPage snapshot={snapshot} />,
  },
  "/rollback": {
    emptyData: emptyRollbackSnapshot,
    queryFn: async () =>
      (await import("@/pages/rollback/api/rollback-snapshot")).fetchRollbackSnapshot(),
    queryKey: ["rollback-snapshot"],
    render: (snapshot) => <RollbackPage snapshot={snapshot} />,
  },
  "/settings": {
    emptyData: emptySettingsSnapshot,
    queryFn: async () =>
      (await import("@/pages/settings/api/settings-snapshot")).fetchSettingsSnapshot(),
    queryKey: ["settings-snapshot"],
    render: (snapshot) => <SettingsPage snapshot={snapshot} />,
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

          <Suspense fallback={<PageFallback />}>
            {routeConfig.render(pageData, {
              isFetching,
              refetch: refetchPage,
            })}
          </Suspense>
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

function PageFallback() {
  return (
    <div className="space-y-4 px-6 py-5">
      <Card className="h-22 animate-pulse rounded-lg border-slate-200 bg-white shadow-none" />
      <Card className="h-96 animate-pulse rounded-lg border-slate-200 bg-white shadow-none" />
    </div>
  );
}
