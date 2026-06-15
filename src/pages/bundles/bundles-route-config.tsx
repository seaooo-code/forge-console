import { lazy } from "react";

import type { PageRouteConfig } from "@/types/page-route";

import type { BundlesSnapshot } from "./types";

const BundlesPage = lazy(async () => ({
  default: (await import("./BundlesPage")).BundlesPage,
}));

const emptyBundlesSnapshot: BundlesSnapshot = {
  bundles: [],
};

export function getBundlesRouteConfig(path: string): PageRouteConfig | null {
  if (path !== "/bundles") {
    return null;
  }

  return {
    emptyData: emptyBundlesSnapshot,
    queryFn: async () => (await import("./api/bundles-snapshot")).fetchBundlesSnapshot(),
    queryKey: ["bundles-snapshot"],
    render: (snapshot) => <BundlesPage snapshot={snapshot as BundlesSnapshot} />,
  };
}
