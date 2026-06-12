import { type QueryKey, useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  applicationsSnapshotQueryKey,
  emptyApplicationListFilters,
} from "@/pages/applications/api/application-list-filters";
import type { ApplicationListFilters, HostApplication } from "@/pages/applications/types";
import type { StorageConfigRecord } from "@/pages/storage/types";
import { useApplicationOptionsStore } from "@/store/use-application-options-store";
import { type MiCarEnvironmentCode, miCarEnvironmentCodes } from "@/types/environments";

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

const ApplicationCreatePage = lazy(async () => ({
  default: (await import("@/pages/applications/ApplicationCreatePage"))
    .ApplicationCreatePage as unknown as AnyPage,
}));

const ApplicationDetailPage = lazy(async () => ({
  default: (await import("@/pages/applications/ApplicationDetailPage"))
    .ApplicationDetailPage as unknown as AnyPage,
}));

const EnvironmentsPage = lazy(async () => ({
  default: (await import("@/pages/environments/EnvironmentsPage"))
    .EnvironmentsPage as unknown as AnyPage,
}));

const EnvironmentDetailPage = lazy(async () => ({
  default: (await import("@/pages/environments/EnvironmentDetailPage"))
    .EnvironmentDetailPage as unknown as AnyPage,
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

const StoragePage = lazy(async () => ({
  default: (await import("@/pages/storage/StoragePage")).StoragePage as unknown as AnyPage,
}));

const StorageCreatePage = lazy(async () => ({
  default: (await import("@/pages/storage/StorageCreatePage"))
    .StorageCreatePage as unknown as AnyPage,
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
  details: {},
  summary: {
    maintenance: 0,
    offline: 0,
    running: 0,
    total: 0,
  },
};

const emptyEnvironmentsSnapshot = {
  details: {},
  environments: [],
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

const emptyStorageSnapshot = {
  configurations: [],
};

type PageRenderOptions = {
  isFetching: boolean;
  navigateTo: (path: string) => void;
  refetch: () => void;
};

type PageRouteConfig = {
  emptyData: unknown;
  queryFn: () => Promise<unknown>;
  queryKey: QueryKey;
  render: (data: unknown, options: PageRenderOptions) => ReactNode;
};

const staticPageRoutes: Record<string, PageRouteConfig> = {
  "/": {
    emptyData: emptyDashboardSnapshot,
    queryFn: async () =>
      (await import("@/pages/dashboard/api/dashboard-snapshot")).fetchDashboardSnapshot(),
    queryKey: ["dashboard-snapshot"],
    render: (snapshot) => <DashboardPage snapshot={snapshot} />,
  },
  "/environments": {
    emptyData: emptyEnvironmentsSnapshot,
    queryFn: async () =>
      (await import("@/pages/environments/api/environments-snapshot")).fetchEnvironmentsSnapshot(),
    queryKey: ["environments"],
    render: (snapshot, { navigateTo }) => (
      <EnvironmentsPage
        onOpenEnvironment={(environmentId: MiCarEnvironmentCode) =>
          navigateTo(`/environments/${environmentId}`)
        }
        snapshot={snapshot}
      />
    ),
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
  "/storage": {
    emptyData: emptyStorageSnapshot,
    queryFn: async () =>
      (await import("@/pages/storage/api/storage-snapshot")).fetchStorageSnapshot(),
    queryKey: ["storage-snapshot"],
    render: (snapshot, { navigateTo, refetch }) => (
      <StoragePage
        onCreateStorage={() => navigateTo("/storage/new")}
        onDeleteStorage={async (storage: StorageConfigRecord) => {
          const { deleteStorageConfiguration } = await import(
            "@/pages/storage/api/storage-snapshot"
          );
          await deleteStorageConfiguration(storage.id);
          await refetch();
        }}
        onEditStorage={(storageId: string) => navigateTo(`/storage/${storageId}/edit`)}
        snapshot={snapshot}
      />
    ),
  },
};

function getRouteConfig(
  path: string,
  applicationFilters: ApplicationListFilters,
  onApplicationsChanged: () => Promise<void>,
  onStorageChanged: () => Promise<void>,
  onApplicationFiltersChange: (filters: ApplicationListFilters) => void,
): PageRouteConfig {
  if (path === "/apps") {
    return {
      emptyData: emptyApplicationsSnapshot,
      queryFn: async () =>
        (await import("@/pages/applications/api/applications-snapshot")).fetchApplicationsSnapshot(
          applicationFilters,
        ),
      queryKey: applicationsSnapshotQueryKey(applicationFilters),
      render: (snapshot, { isFetching, navigateTo, refetch }) => {
        const applicationsSnapshot = snapshot as typeof emptyApplicationsSnapshot;

        return (
          <ApplicationsPage
            applications={applicationsSnapshot.applications}
            filters={applicationFilters}
            isFetching={isFetching}
            onFiltersChange={onApplicationFiltersChange}
            onConfigureApplication={(applicationSlug: string) =>
              navigateTo(`/apps/${applicationSlug}/edit`)
            }
            onCreateApplication={() => navigateTo("/apps/new")}
            onDeleteApplication={async (application: HostApplication) => {
              const { deleteApplication } = await import(
                "@/pages/applications/api/applications-snapshot"
              );
              await deleteApplication(application.slug);
              await onApplicationsChanged();
              await refetch();
            }}
            onOpenApplication={(applicationSlug: string) => navigateTo(`/apps/${applicationSlug}`)}
            onRefresh={refetch}
            summary={applicationsSnapshot.summary}
          />
        );
      },
    };
  }

  if (path === "/apps/new") {
    return {
      emptyData: null,
      queryFn: async () => null,
      queryKey: ["applications-snapshot", "new"],
      render: (_, { navigateTo }) => (
        <ApplicationCreatePage
          onBack={() => navigateTo("/apps")}
          onSaved={(applicationSlug: string) => {
            void onApplicationsChanged().finally(() => navigateTo(`/apps/${applicationSlug}`));
          }}
        />
      ),
    };
  }

  if (path === "/storage/new") {
    return {
      emptyData: null,
      queryFn: async () => null,
      queryKey: ["storage-snapshot", "new"],
      render: (_, { navigateTo }) => (
        <StorageCreatePage
          onBack={() => navigateTo("/storage")}
          onSaved={() => {
            void onStorageChanged().finally(() => navigateTo("/storage"));
          }}
        />
      ),
    };
  }

  const storageEditId = getStorageEditId(path);

  if (storageEditId) {
    return {
      emptyData: emptyStorageSnapshot,
      queryFn: async () =>
        (await import("@/pages/storage/api/storage-snapshot")).fetchStorageDetailSnapshot(
          storageEditId,
        ),
      queryKey: ["storage-snapshot", "edit", storageEditId],
      render: (snapshot, { isFetching, navigateTo }) => (
        <StorageCreatePage
          isFetching={isFetching}
          mode="edit"
          onBack={() => navigateTo("/storage")}
          onSaved={() => {
            void onStorageChanged().finally(() => navigateTo("/storage"));
          }}
          snapshot={snapshot}
          storageId={storageEditId}
        />
      ),
    };
  }

  const applicationEditSlug = getApplicationEditSlug(path);

  if (applicationEditSlug) {
    return {
      emptyData: emptyApplicationsSnapshot,
      queryFn: async () =>
        (
          await import("@/pages/applications/api/applications-snapshot")
        ).fetchApplicationDetailSnapshot(applicationEditSlug),
      queryKey: ["applications-snapshot", "edit", applicationEditSlug],
      render: (snapshot, { isFetching, navigateTo }) => (
        <ApplicationCreatePage
          applicationSlug={applicationEditSlug}
          isFetching={isFetching}
          mode="edit"
          onBack={() => navigateTo(`/apps/${applicationEditSlug}`)}
          onSaved={(applicationSlug: string) => {
            void onApplicationsChanged().finally(() => navigateTo(`/apps/${applicationSlug}`));
          }}
          snapshot={snapshot}
        />
      ),
    };
  }

  const applicationSlug = getApplicationDetailSlug(path);

  if (applicationSlug) {
    return {
      emptyData: emptyApplicationsSnapshot,
      queryFn: async () =>
        (
          await import("@/pages/applications/api/applications-snapshot")
        ).fetchApplicationDetailSnapshot(applicationSlug),
      queryKey: ["applications-snapshot", "detail", applicationSlug],
      render: (snapshot, { isFetching, navigateTo }) => (
        <ApplicationDetailPage
          applicationSlug={applicationSlug}
          isFetching={isFetching}
          onApplicationChanged={onApplicationsChanged}
          onBack={() => navigateTo("/apps")}
          onEditApplication={(slug: string) => navigateTo(`/apps/${slug}/edit`)}
          snapshot={snapshot}
        />
      ),
    };
  }

  const environmentId = getEnvironmentDetailId(path);

  if (environmentId) {
    return {
      emptyData: emptyEnvironmentsSnapshot,
      queryFn: async () =>
        (
          await import("@/pages/environments/api/environments-snapshot")
        ).fetchEnvironmentDetailSnapshot(environmentId),
      queryKey: ["environments", "detail", environmentId],
      render: (snapshot, { isFetching, navigateTo }) => (
        <EnvironmentDetailPage
          environmentId={environmentId}
          isFetching={isFetching}
          onBack={() => navigateTo("/environments")}
          snapshot={snapshot}
        />
      ),
    };
  }

  return staticPageRoutes[path] ?? staticPageRoutes["/"];
}

export function ConsoleLayout() {
  const queryClient = useQueryClient();
  const [routePath, setRoutePath] = useState(getCurrentPath);
  const [applicationFilters, setApplicationFilters] = useState<ApplicationListFilters>(
    emptyApplicationListFilters,
  );
  const setActiveNavId = useConsoleLayoutStore((state) => state.setActiveNavId);
  const applicationOptionsStatus = useApplicationOptionsStore((state) => state.status);
  const setApplicationOptions = useApplicationOptionsStore((state) => state.setOptions);
  const setApplicationOptionsError = useApplicationOptionsStore((state) => state.setError);
  const setApplicationOptionsLoading = useApplicationOptionsStore((state) => state.setLoading);
  const activeNav = useMemo(() => findNavItem(routePath) ?? findNavItem("/"), [routePath]);
  const handleApplicationsChanged = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["applications-snapshot"] }),
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
        handleStorageChanged,
        setApplicationFilters,
      ),
    [applicationFilters, handleApplicationsChanged, handleStorageChanged, routePath],
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

  useEffect(() => {
    if (applicationOptionsStatus !== "idle") {
      return;
    }

    let disposed = false;
    const idleWindow = window as Window & {
      cancelIdleCallback?: (handle: number) => void;
      requestIdleCallback?: (callback: () => void) => number;
    };

    const loadOptions = () => {
      setApplicationOptionsLoading();
      void import("@/pages/applications/api/applications-snapshot")
        .then(({ fetchApplicationOptions }) => fetchApplicationOptions())
        .then((options) => {
          if (!disposed) {
            setApplicationOptions(options);
          }
        })
        .catch(() => {
          if (!disposed) {
            setApplicationOptionsError("load application options failed");
          }
        });
    };

    const handle =
      idleWindow.requestIdleCallback?.(loadOptions) ?? window.setTimeout(loadOptions, 0);

    return () => {
      disposed = true;
      if (idleWindow.cancelIdleCallback && typeof handle === "number") {
        idleWindow.cancelIdleCallback(handle);
        return;
      }
      window.clearTimeout(handle);
    };
  }, [
    applicationOptionsStatus,
    setApplicationOptions,
    setApplicationOptionsError,
    setApplicationOptionsLoading,
  ]);

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

function getApplicationDetailSlug(path: string): string | null {
  const normalizedPath = normalizePath(path);
  const prefix = "/apps/";

  if (!normalizedPath.startsWith(prefix)) {
    return null;
  }

  const applicationSlug = normalizedPath.slice(prefix.length);

  if (applicationSlug === "" || applicationSlug === "new" || applicationSlug.includes("/")) {
    return null;
  }

  return applicationSlug;
}

function getApplicationEditSlug(path: string): string | null {
  const normalizedPath = normalizePath(path);
  const prefix = "/apps/";
  const suffix = "/edit";

  if (!normalizedPath.startsWith(prefix) || !normalizedPath.endsWith(suffix)) {
    return null;
  }

  const applicationSlug = normalizedPath.slice(prefix.length, -suffix.length);

  if (applicationSlug === "" || applicationSlug.includes("/")) {
    return null;
  }

  return applicationSlug;
}

function getStorageEditId(path: string): string | null {
  const normalizedPath = normalizePath(path);
  const prefix = "/storage/";
  const suffix = "/edit";

  if (!normalizedPath.startsWith(prefix) || !normalizedPath.endsWith(suffix)) {
    return null;
  }

  const storageId = normalizedPath.slice(prefix.length, -suffix.length);

  if (storageId === "" || storageId.includes("/")) {
    return null;
  }

  return storageId;
}

function getEnvironmentDetailId(path: string): MiCarEnvironmentCode | null {
  const normalizedPath = normalizePath(path);
  const prefix = "/environments/";

  if (!normalizedPath.startsWith(prefix)) {
    return null;
  }

  const environmentId = normalizedPath.slice(prefix.length);

  return miCarEnvironmentCodes.includes(environmentId as MiCarEnvironmentCode)
    ? (environmentId as MiCarEnvironmentCode)
    : null;
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
