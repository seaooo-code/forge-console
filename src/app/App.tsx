import { lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router";

import { fetchAuthSession } from "@/api/feishu-auth";
import { FeishuCallbackPage, LoginPage } from "@/pages/auth";
import { useAuthStore } from "@/store/use-auth-store";
import { useSystemThemeSync } from "@/store/use-system-theme-sync";

import { ConsoleLayout, ConsoleRouteNotFound } from "./layouts/ConsoleLayout";

const AccessTokensPage = lazy(async () => ({
  default: (await import("@/pages/access-tokens")).AccessTokensPage,
}));

const ApplicationCreatePage = lazy(async () => ({
  default: (await import("@/pages/applications")).ApplicationCreatePage,
}));

const ApplicationDetailPage = lazy(async () => ({
  default: (await import("@/pages/applications")).ApplicationDetailPage,
}));

const ApplicationsPage = lazy(async () => ({
  default: (await import("@/pages/applications")).ApplicationsPage,
}));

const BuildAdaptersPage = lazy(async () => ({
  default: (await import("@/pages/build-adapters")).BuildAdaptersPage,
}));

const BuildAdapterEditPage = lazy(async () => ({
  default: (await import("@/pages/build-adapters")).BuildAdapterEditPage,
}));

const BuildsPage = lazy(async () => ({
  default: (await import("@/pages/builds")).BuildsPage,
}));

const CodeSourcesPage = lazy(async () => ({
  default: (await import("@/pages/code-sources")).CodeSourcesPage,
}));

const OverviewPage = lazy(async () => ({
  default: (await import("@/pages/overview")).OverviewPage,
}));

const ReleaseRecordsPage = lazy(async () => ({
  default: (await import("@/pages/release-records")).ReleaseRecordsPage,
}));

const EnvironmentCreatePage = lazy(async () => ({
  default: (await import("@/pages/environments")).EnvironmentCreatePage,
}));

const EnvironmentsPage = lazy(async () => ({
  default: (await import("@/pages/environments")).EnvironmentsPage,
}));

const ModulesPage = lazy(async () => ({
  default: (await import("@/pages/modules")).ModulesPage,
}));

const ModuleCreatePage = lazy(async () => ({
  default: (await import("@/pages/modules")).ModuleCreatePage,
}));

const ModuleDetailPage = lazy(async () => ({
  default: (await import("@/pages/modules")).ModuleDetailPage,
}));

const StoragePage = lazy(async () => ({
  default: (await import("@/pages/storage")).StoragePage,
}));

const loginPath = "/login";
const feishuCallbackPath = "/login/feishu/callback";

export function App() {
  const location = useLocation();
  useSystemThemeSync();
  const isSessionLoading = useAuthStore((state) => state.isSessionLoading);
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const setSession = useAuthStore((state) => state.setSession);
  const setSessionLoading = useAuthStore((state) => state.setSessionLoading);
  const routePath = location.pathname;

  useEffect(() => {
    if (routePath === feishuCallbackPath || session) {
      return;
    }

    let mounted = true;
    setSessionLoading(true);

    fetchAuthSession()
      .then((currentSession) => {
        if (!mounted) {
          return;
        }

        if (currentSession) {
          setSession(currentSession);
          return;
        }
        clearSession();
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        clearSession();
      });

    return () => {
      mounted = false;
    };
  }, [clearSession, routePath, session, setSession, setSessionLoading]);

  if (routePath === feishuCallbackPath) {
    return <FeishuCallbackPage />;
  }

  if (isSessionLoading) {
    return <SessionLoadingPage />;
  }

  if (!session) {
    return <LoginPage redirectPath={isAuthRoute(routePath) ? "/" : routePath} />;
  }

  if (isAuthRoute(routePath)) {
    return <Navigate to="/" replace />;
  }

  return <ConsoleRoutes />;
}

function isAuthRoute(path: string) {
  return path === loginPath || path === feishuCallbackPath;
}

function SessionLoadingPage() {
  return (
    <main className="flex min-h-screen bg-shell p-2 text-foreground">
      <div className="flex-1 animate-pulse rounded-2xl bg-background shadow-edge" />
    </main>
  );
}

function ConsoleRoutes() {
  return (
    <Routes>
      <Route element={<ConsoleLayout />}>
        <Route index element={<OverviewRoute />} />
        <Route path="apps" element={<ApplicationsRoute />} />
        <Route path="apps/new" element={<ApplicationCreateRoute />} />
        <Route path="apps/:applicationSlug/edit" element={<ApplicationEditRoute />} />
        <Route path="apps/:applicationSlug" element={<ApplicationDetailRoute />} />
        <Route path="modules" element={<ModulesRoute />} />
        <Route path="modules/new" element={<ModuleCreateRoute />} />
        <Route path="modules/:moduleId/edit" element={<ModuleEditRoute />} />
        <Route path="modules/:moduleId" element={<ModuleDetailRoute />} />
        <Route path="builds" element={<BuildsRoute />} />
        <Route path="builds/:buildId" element={<BuildsRoute />} />
        <Route path="release-records" element={<ReleaseRecordsRoute />} />
        <Route path="release-records/:releaseId" element={<ReleaseRecordsRoute />} />
        <Route path="deployments" element={<Navigate to="/release-records" replace />} />
        <Route path="deployments/:releaseId" element={<DeploymentDetailRedirect />} />
        <Route path="code-sources" element={<CodeSourcesPage />} />
        <Route path="build-adapters" element={<BuildAdaptersRoute />} />
        <Route path="build-adapters/new" element={<BuildAdapterCreateRoute />} />
        <Route path="build-adapters/:adapterId" element={<BuildAdapterEditRoute />} />
        <Route path="storage" element={<StorageRoute />} />
        <Route path="storage/new" element={<StorageRoute />} />
        <Route path="storage/:storageId/edit" element={<StorageRoute />} />
        <Route path="environments" element={<EnvironmentsRoute />} />
        <Route path="environments/new" element={<EnvironmentCreateRoute />} />
        <Route path="environments/:environmentId/edit" element={<EnvironmentEditRoute />} />
        <Route path="access-tokens" element={<AccessTokensPage />} />
        <Route path="*" element={<ConsoleRouteNotFound />} />
      </Route>
    </Routes>
  );
}

function OverviewRoute() {
  const navigate = useNavigate();

  return (
    <OverviewPage
      onCreateModule={() => navigate("/modules/new")}
      onOpenBuild={(buildId: string) => navigate(`/builds/${encodeURIComponent(buildId)}`)}
      onOpenCodeSources={() => navigate("/code-sources")}
    />
  );
}

function ApplicationsRoute() {
  const navigate = useNavigate();

  return (
    <ApplicationsPage
      onConfigureApplication={(applicationSlug: string) =>
        navigate(`/apps/${encodeURIComponent(applicationSlug)}/edit`)
      }
      onCreateApplication={() => navigate("/apps/new")}
      onOpenApplication={(applicationSlug: string) =>
        navigate(`/apps/${encodeURIComponent(applicationSlug)}`)
      }
    />
  );
}

function ApplicationCreateRoute() {
  const navigate = useNavigate();

  return (
    <ApplicationCreatePage
      onBack={() => navigate("/apps")}
      onSaved={(applicationSlug: string) =>
        navigate(`/apps/${encodeURIComponent(applicationSlug)}`)
      }
    />
  );
}

function ApplicationEditRoute() {
  const navigate = useNavigate();
  const { applicationSlug } = useParams<{ applicationSlug: string }>();

  if (!applicationSlug) {
    return <Navigate to="/apps" replace />;
  }

  return (
    <ApplicationCreatePage
      applicationSlug={applicationSlug}
      mode="edit"
      onBack={() => navigate(`/apps/${encodeURIComponent(applicationSlug)}`)}
      onSaved={(savedApplicationSlug: string) =>
        navigate(`/apps/${encodeURIComponent(savedApplicationSlug)}`)
      }
    />
  );
}

function ApplicationDetailRoute() {
  const navigate = useNavigate();
  const { applicationSlug } = useParams<{ applicationSlug: string }>();

  if (!applicationSlug) {
    return <Navigate to="/apps" replace />;
  }

  return (
    <ApplicationDetailPage
      applicationSlug={applicationSlug}
      onBack={() => navigate("/apps")}
      onEditApplication={(slug: string) => navigate(`/apps/${encodeURIComponent(slug)}/edit`)}
      onOpenApplicationBuilds={(applicationId: string) =>
        navigate(`/builds?applicationId=${encodeURIComponent(applicationId)}`)
      }
      onOpenApplicationModules={(applicationId: string) =>
        navigate(`/modules?applicationId=${encodeURIComponent(applicationId)}`)
      }
      onOpenApplicationReleases={(applicationId: string) =>
        navigate(`/release-records?applicationId=${encodeURIComponent(applicationId)}`)
      }
    />
  );
}

function BuildAdaptersRoute() {
  const navigate = useNavigate();

  return (
    <BuildAdaptersPage
      onCreateBuildAdapter={() => navigate("/build-adapters/new")}
      onOpenBuildAdapter={(adapterId: string) =>
        navigate(`/build-adapters/${encodeURIComponent(adapterId)}`)
      }
    />
  );
}

function BuildAdapterCreateRoute() {
  const navigate = useNavigate();

  return (
    <BuildAdapterEditPage
      onBack={() => navigate("/build-adapters")}
      onCreated={(adapterId: string) =>
        navigate(`/build-adapters/${encodeURIComponent(adapterId)}`, { replace: true })
      }
    />
  );
}

function BuildAdapterEditRoute() {
  const navigate = useNavigate();
  const { adapterId } = useParams<{ adapterId: string }>();

  if (!adapterId) {
    return <Navigate to="/build-adapters" replace />;
  }

  return (
    <BuildAdapterEditPage
      key={adapterId}
      adapterId={adapterId}
      onBack={() => navigate("/build-adapters")}
    />
  );
}

function ModulesRoute() {
  const navigate = useNavigate();

  return (
    <ModulesPage
      onCreateModule={() => navigate("/modules/new")}
      onEditModule={(moduleId: string) => navigate(`/modules/${encodeURIComponent(moduleId)}/edit`)}
      onOpenModule={(moduleId: string) => navigate(`/modules/${encodeURIComponent(moduleId)}`)}
    />
  );
}

function ModuleCreateRoute() {
  const navigate = useNavigate();

  return (
    <ModuleCreatePage
      onBack={() => navigate("/modules")}
      onOpenCodeSources={() => navigate("/code-sources")}
      onSaved={() => navigate("/modules")}
    />
  );
}

function ModuleEditRoute() {
  const navigate = useNavigate();
  const { moduleId } = useParams<{ moduleId: string }>();

  if (!moduleId) {
    return <Navigate to="/modules" replace />;
  }

  return (
    <ModuleCreatePage
      mode="edit"
      moduleId={moduleId}
      onBack={() => navigate("/modules")}
      onSaved={() => navigate("/modules")}
    />
  );
}

function ModuleDetailRoute() {
  const navigate = useNavigate();
  const { moduleId } = useParams<{ moduleId: string }>();

  if (!moduleId) {
    return <Navigate to="/modules" replace />;
  }

  return (
    <ModuleDetailPage
      moduleId={moduleId}
      onBack={() => navigate("/modules")}
      onOpenBuild={(buildId: string) => navigate(`/builds/${encodeURIComponent(buildId)}`)}
      onOpenBuildAdapter={(adapterId: string) =>
        navigate(`/build-adapters/${encodeURIComponent(adapterId)}`)
      }
      onEditModule={(editableModuleId: string) =>
        navigate(`/modules/${encodeURIComponent(editableModuleId)}/edit`)
      }
    />
  );
}

function BuildsRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { buildId } = useParams<{ buildId: string }>();

  return (
    <BuildsPage
      selectedBuildId={buildId}
      onSelectBuild={(nextBuildId: string | null) =>
        navigate(
          `${nextBuildId ? `/builds/${encodeURIComponent(nextBuildId)}` : "/builds"}${location.search}`,
        )
      }
      onOpenBuildAdapter={(adapterId: string) =>
        navigate(`/build-adapters/${encodeURIComponent(adapterId)}`)
      }
      onOpenEnvironment={(environmentId: string) =>
        navigate(`/environments/${encodeURIComponent(environmentId)}/edit`)
      }
      onOpenStorage={(storageId: string) =>
        navigate(`/storage/${encodeURIComponent(storageId)}/edit`)
      }
    />
  );
}

function ReleaseRecordsRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { releaseId } = useParams<{ releaseId: string }>();

  return (
    <ReleaseRecordsPage
      selectedReleaseId={releaseId}
      onSelectRelease={(nextReleaseId: string | null) =>
        navigate(
          `${nextReleaseId ? `/release-records/${encodeURIComponent(nextReleaseId)}` : "/release-records"}${location.search}`,
        )
      }
      onOpenApplication={(applicationSlug: string) =>
        navigate(`/apps/${encodeURIComponent(applicationSlug)}`)
      }
      onOpenBuild={(buildId: string) => navigate(`/builds/${encodeURIComponent(buildId)}`)}
      onOpenEnvironment={(environmentId: string) =>
        navigate(`/environments/${encodeURIComponent(environmentId)}/edit`)
      }
      onOpenModule={(moduleId: string) => navigate(`/modules/${encodeURIComponent(moduleId)}`)}
    />
  );
}

function DeploymentDetailRedirect() {
  const { releaseId } = useParams<{ releaseId: string }>();

  return (
    <Navigate
      to={releaseId ? `/release-records/${encodeURIComponent(releaseId)}` : "/release-records"}
      replace
    />
  );
}

function EnvironmentsRoute() {
  const navigate = useNavigate();

  return (
    <EnvironmentsPage
      onCreateEnvironment={() => navigate("/environments/new")}
      onEditEnvironment={(environmentId: string) =>
        navigate(`/environments/${encodeURIComponent(environmentId)}/edit`)
      }
    />
  );
}

function EnvironmentCreateRoute() {
  const navigate = useNavigate();

  return (
    <EnvironmentCreatePage
      onBack={() => navigate("/environments")}
      onSaved={() => navigate("/environments")}
    />
  );
}

function EnvironmentEditRoute() {
  const navigate = useNavigate();
  const { environmentId } = useParams<{ environmentId: string }>();

  if (!environmentId) {
    return <Navigate to="/environments" replace />;
  }

  return (
    <EnvironmentCreatePage
      environmentId={environmentId}
      mode="edit"
      onBack={() => navigate("/environments")}
      onSaved={() => navigate("/environments")}
    />
  );
}

function StorageRoute() {
  const navigate = useNavigate();
  const location = useLocation();
  const { storageId } = useParams<{ storageId: string }>();
  const drawer = storageId
    ? { mode: "edit" as const, storageId }
    : location.pathname === "/storage/new"
      ? { mode: "create" as const }
      : undefined;

  return (
    <StoragePage
      drawer={drawer}
      onCloseDrawer={() => navigate("/storage")}
      onCreateStorage={() => navigate("/storage/new")}
      onEditStorage={(nextStorageId: string) =>
        navigate(`/storage/${encodeURIComponent(nextStorageId)}/edit`)
      }
    />
  );
}
