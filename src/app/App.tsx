import { lazy, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router";

import { fetchAuthSession } from "@/api/feishu-auth";
import { Card } from "@/components/ui/card";
import { FeishuCallbackPage, LoginPage } from "@/pages/auth";
import { useAuthStore } from "@/store/use-auth-store";

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

const BundlesPage = lazy(async () => ({
  default: (await import("@/pages/bundles")).BundlesPage,
}));

const BuildsPage = lazy(async () => ({
  default: (await import("@/pages/builds")).BuildsPage,
}));

const BuildDetailPage = lazy(async () => ({
  default: (await import("@/pages/builds")).BuildDetailPage,
}));

const CombinationsPage = lazy(async () => ({
  default: (await import("@/pages/combinations")).CombinationsPage,
}));

const CodeSourcesPage = lazy(async () => ({
  default: (await import("@/pages/code-sources")).CodeSourcesPage,
}));

const DashboardPage = lazy(async () => ({
  default: (await import("@/pages/dashboard")).DashboardPage,
}));

const DevTasksPage = lazy(async () => ({
  default: (await import("@/pages/dev-tasks")).DevTasksPage,
}));

const ReleaseRecordsPage = lazy(async () => ({
  default: (await import("@/pages/release-records")).ReleaseRecordsPage,
}));

const ReleaseRecordDetailPage = lazy(async () => ({
  default: (await import("@/pages/release-records")).ReleaseRecordDetailPage,
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

const PipelinesPage = lazy(async () => ({
  default: (await import("@/pages/pipelines")).PipelinesPage,
}));

const ReleasesPage = lazy(async () => ({
  default: (await import("@/pages/releases")).ReleasesPage,
}));

const SettingsPage = lazy(async () => ({
  default: (await import("@/pages/settings")).SettingsPage,
}));

const StorageCreatePage = lazy(async () => ({
  default: (await import("@/pages/storage")).StorageCreatePage,
}));

const StoragePage = lazy(async () => ({
  default: (await import("@/pages/storage")).StoragePage,
}));

const loginPath = "/login";
const feishuCallbackPath = "/login/feishu/callback";

export function App() {
  const location = useLocation();
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
    <main className="grid min-h-screen place-items-center bg-slate-50 px-6 text-slate-900">
      <Card className="h-24 w-full max-w-sm animate-pulse rounded-lg border-slate-200 bg-white shadow-sm" />
    </main>
  );
}

function ConsoleRoutes() {
  return (
    <Routes>
      <Route element={<ConsoleLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="apps" element={<ApplicationsRoute />} />
        <Route path="apps/new" element={<ApplicationCreateRoute />} />
        <Route path="apps/:applicationSlug/edit" element={<ApplicationEditRoute />} />
        <Route path="apps/:applicationSlug" element={<ApplicationDetailRoute />} />
        <Route path="modules" element={<ModulesRoute />} />
        <Route path="modules/new" element={<ModuleCreateRoute />} />
        <Route path="modules/:moduleId/edit" element={<ModuleEditRoute />} />
        <Route path="modules/:moduleId" element={<ModuleDetailRoute />} />
        <Route path="dev-tasks" element={<DevTasksPage />} />
        <Route path="pipelines" element={<PipelinesPage />} />
        <Route path="builds" element={<BuildsRoute />} />
        <Route path="builds/:buildId" element={<BuildDetailRoute />} />
        <Route path="bundles" element={<BundlesPage />} />
        <Route path="combinations" element={<CombinationsPage />} />
        <Route path="releases" element={<ReleasesPage />} />
        <Route path="release-records" element={<ReleaseRecordsRoute />} />
        <Route path="release-records/:releaseId" element={<ReleaseRecordDetailRoute />} />
        <Route path="deployments" element={<Navigate to="/release-records" replace />} />
        <Route path="deployments/:releaseId" element={<DeploymentDetailRedirect />} />
        <Route path="code-sources" element={<CodeSourcesPage />} />
        <Route path="storage" element={<StorageRoute />} />
        <Route path="storage/new" element={<StorageCreateRoute />} />
        <Route path="storage/:storageId/edit" element={<StorageEditRoute />} />
        <Route path="environments" element={<EnvironmentsRoute />} />
        <Route path="environments/new" element={<EnvironmentCreateRoute />} />
        <Route path="environments/:environmentId/edit" element={<EnvironmentEditRoute />} />
        <Route path="access-tokens" element={<AccessTokensPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<ConsoleRouteNotFound />} />
      </Route>
    </Routes>
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
      onEditModule={(editableModuleId: string) =>
        navigate(`/modules/${encodeURIComponent(editableModuleId)}/edit`)
      }
    />
  );
}

function BuildsRoute() {
  const navigate = useNavigate();

  return (
    <BuildsPage
      onOpenBuild={(buildId: string) => navigate(`/builds/${encodeURIComponent(buildId)}`)}
    />
  );
}

function BuildDetailRoute() {
  const navigate = useNavigate();
  const { buildId } = useParams<{ buildId: string }>();

  if (!buildId) {
    return <Navigate to="/builds" replace />;
  }

  return (
    <BuildDetailPage
      buildId={buildId}
      onBack={() => navigate("/builds")}
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

  return (
    <ReleaseRecordsPage
      onOpenRelease={(releaseId: string) =>
        navigate(`/release-records/${encodeURIComponent(releaseId)}`)
      }
    />
  );
}

function ReleaseRecordDetailRoute() {
  const navigate = useNavigate();
  const { releaseId } = useParams<{ releaseId: string }>();

  if (!releaseId) {
    return <Navigate to="/release-records" replace />;
  }

  return (
    <ReleaseRecordDetailPage
      releaseId={releaseId}
      onBack={() => navigate("/release-records")}
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

  return (
    <StoragePage
      onCreateStorage={() => navigate("/storage/new")}
      onEditStorage={(storageId: string) =>
        navigate(`/storage/${encodeURIComponent(storageId)}/edit`)
      }
    />
  );
}

function StorageCreateRoute() {
  const navigate = useNavigate();

  return (
    <StorageCreatePage onBack={() => navigate("/storage")} onSaved={() => navigate("/storage")} />
  );
}

function StorageEditRoute() {
  const navigate = useNavigate();
  const { storageId } = useParams<{ storageId: string }>();

  if (!storageId) {
    return <Navigate to="/storage" replace />;
  }

  return (
    <StorageCreatePage
      mode="edit"
      onBack={() => navigate("/storage")}
      onSaved={() => navigate("/storage")}
      storageId={storageId}
    />
  );
}
