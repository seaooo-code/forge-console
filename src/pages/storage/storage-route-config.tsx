import { lazy } from "react";

import type { PageRouteConfig } from "@/types/page-route";

import { storageEditQueryKey, storageSnapshotQueryKey } from "./api/storage-query-keys";
import type { StorageConfigRecord, StorageSnapshot } from "./types";

const StoragePage = lazy(async () => ({
  default: (await import("./StoragePage")).StoragePage,
}));

const StorageCreatePage = lazy(async () => ({
  default: (await import("./StorageCreatePage")).StorageCreatePage,
}));

const emptyStorageSnapshot: StorageSnapshot = {
  configurations: [],
};

type GetStorageRouteConfigOptions = {
  onStorageChanged: () => Promise<void>;
  path: string;
};

export function getStorageRouteConfig({
  onStorageChanged,
  path,
}: GetStorageRouteConfigOptions): PageRouteConfig | null {
  if (path === "/storage") {
    return {
      emptyData: emptyStorageSnapshot,
      queryFn: async () => (await import("./api/storage-snapshot")).fetchStorageSnapshot(),
      queryKey: storageSnapshotQueryKey,
      render: (snapshot, { navigateTo, refetch }) => (
        <StoragePage
          onCreateStorage={() => navigateTo("/storage/new")}
          onDeleteStorage={async (storage: StorageConfigRecord) => {
            const { deleteStorageConfiguration } = await import("./api/storage-snapshot");
            await deleteStorageConfiguration(storage.id);
            await onStorageChanged();
            await refetch();
          }}
          onEditStorage={(storageId: string) => navigateTo(`/storage/${storageId}/edit`)}
          snapshot={snapshot as StorageSnapshot}
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
        (await import("./api/storage-snapshot")).fetchStorageDetailSnapshot(storageEditId),
      queryKey: storageEditQueryKey(storageEditId),
      render: (snapshot, { isFetching, navigateTo }) => (
        <StorageCreatePage
          isFetching={isFetching}
          mode="edit"
          onBack={() => navigateTo("/storage")}
          onSaved={() => {
            void onStorageChanged().finally(() => navigateTo("/storage"));
          }}
          snapshot={snapshot as StorageSnapshot}
          storageId={storageEditId}
        />
      ),
    };
  }

  return null;
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

function normalizePath(path: string) {
  if (path === "") {
    return "/";
  }

  return path.replace(/\/+$/, "") || "/";
}
