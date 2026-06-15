import { lazy } from "react";

import type { StorageSnapshot } from "@/pages/storage";
import type { PageRouteConfig } from "@/types/page-route";

import { environmentsSnapshotQueryKey } from "./api/environment-query-keys";
import type { EnvironmentsSnapshot } from "./types";

const EnvironmentsPage = lazy(async () => ({
  default: (await import("./EnvironmentsPage")).EnvironmentsPage,
}));

const EnvironmentCreatePage = lazy(async () => ({
  default: (await import("./EnvironmentCreatePage")).EnvironmentCreatePage,
}));

const emptyEnvironmentsSnapshot: EnvironmentsSnapshot = {
  details: {},
  environments: [],
};

const emptyStorageSnapshot: StorageSnapshot = {
  configurations: [],
};

type GetEnvironmentRouteConfigOptions = {
  onEnvironmentsChanged: () => Promise<void>;
  path: string;
};

export function getEnvironmentRouteConfig({
  onEnvironmentsChanged,
  path,
}: GetEnvironmentRouteConfigOptions): PageRouteConfig | null {
  if (path === "/environments") {
    return {
      emptyData: emptyEnvironmentsSnapshot,
      queryFn: async () =>
        (await import("./api/environments-snapshot")).fetchEnvironmentsSnapshot(),
      queryKey: environmentsSnapshotQueryKey,
      render: (snapshot, { navigateTo }) => (
        <EnvironmentsPage
          onCreateEnvironment={() => navigateTo("/environments/new")}
          snapshot={snapshot as EnvironmentsSnapshot}
        />
      ),
    };
  }

  if (path === "/environments/new") {
    return {
      emptyData: emptyStorageSnapshot,
      queryFn: async () =>
        (await import("@/pages/storage/api/storage-snapshot")).fetchStorageSnapshot(),
      queryKey: ["storage-snapshot", "environment-new"],
      render: (snapshot, { isFetching, navigateTo }) => (
        <EnvironmentCreatePage
          isFetching={isFetching}
          onBack={() => navigateTo("/environments")}
          onSaved={() => {
            void onEnvironmentsChanged().finally(() => navigateTo("/environments"));
          }}
          snapshot={snapshot as StorageSnapshot}
        />
      ),
    };
  }

  return null;
}
