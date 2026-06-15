import { lazy } from "react";

import type { PageRouteConfig } from "@/types/page-route";

import {
  applicationDetailQueryKey,
  applicationEditQueryKey,
  applicationsSnapshotQueryKey,
} from "./api/application-list-filters";
import type { ApplicationListFilters, ApplicationsSnapshot, HostApplication } from "./types";

const ApplicationsPage = lazy(async () => ({
  default: (await import("./ApplicationsPage")).ApplicationsPage,
}));

const ApplicationCreatePage = lazy(async () => ({
  default: (await import("./ApplicationCreatePage")).ApplicationCreatePage,
}));

const ApplicationDetailPage = lazy(async () => ({
  default: (await import("./ApplicationDetailPage")).ApplicationDetailPage,
}));

const emptyApplicationsSnapshot: ApplicationsSnapshot = {
  applications: [],
  details: {},
  summary: {
    maintenance: 0,
    offline: 0,
    running: 0,
    total: 0,
  },
};

type GetApplicationRouteConfigOptions = {
  applicationFilters: ApplicationListFilters;
  onApplicationFiltersChange: (filters: ApplicationListFilters) => void;
  onApplicationsChanged: () => Promise<void>;
  path: string;
};

export function getApplicationRouteConfig({
  applicationFilters,
  onApplicationFiltersChange,
  onApplicationsChanged,
  path,
}: GetApplicationRouteConfigOptions): PageRouteConfig | null {
  if (path === "/apps") {
    return {
      emptyData: emptyApplicationsSnapshot,
      queryFn: async () =>
        (await import("./api/applications-snapshot")).fetchApplicationsSnapshot(applicationFilters),
      queryKey: applicationsSnapshotQueryKey(applicationFilters),
      render: (snapshot, { isFetching, navigateTo, refetch }) => {
        const applicationsSnapshot = snapshot as ApplicationsSnapshot;

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
              const { deleteApplication } = await import("./api/applications-snapshot");
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

  const applicationEditSlug = getApplicationEditSlug(path);

  if (applicationEditSlug) {
    return {
      emptyData: emptyApplicationsSnapshot,
      queryFn: async () =>
        (await import("./api/applications-snapshot")).fetchApplicationDetailSnapshot(
          applicationEditSlug,
        ),
      queryKey: applicationEditQueryKey(applicationEditSlug),
      render: (snapshot, { isFetching, navigateTo }) => (
        <ApplicationCreatePage
          applicationSlug={applicationEditSlug}
          isFetching={isFetching}
          mode="edit"
          onBack={() => navigateTo(`/apps/${applicationEditSlug}`)}
          onSaved={(applicationSlug: string) => {
            void onApplicationsChanged().finally(() => navigateTo(`/apps/${applicationSlug}`));
          }}
          snapshot={snapshot as ApplicationsSnapshot}
        />
      ),
    };
  }

  const applicationSlug = getApplicationDetailSlug(path);

  if (applicationSlug) {
    return {
      emptyData: emptyApplicationsSnapshot,
      queryFn: async () =>
        (await import("./api/applications-snapshot")).fetchApplicationDetailSnapshot(
          applicationSlug,
        ),
      queryKey: applicationDetailQueryKey(applicationSlug),
      render: (snapshot, { isFetching, navigateTo }) => (
        <ApplicationDetailPage
          applicationSlug={applicationSlug}
          isFetching={isFetching}
          onApplicationChanged={onApplicationsChanged}
          onBack={() => navigateTo("/apps")}
          onEditApplication={(slug: string) => navigateTo(`/apps/${slug}/edit`)}
          snapshot={snapshot as ApplicationsSnapshot}
        />
      ),
    };
  }

  return null;
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

function normalizePath(path: string) {
  if (path === "") {
    return "/";
  }

  return path.replace(/\/+$/, "") || "/";
}
