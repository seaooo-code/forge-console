import { lazy } from "react";

import type { PageRouteConfig } from "@/types/page-route";

import type { CombinationsSnapshot } from "./types";

const CombinationsPage = lazy(async () => ({
  default: (await import("./CombinationsPage")).CombinationsPage,
}));

const emptyCombinationsSnapshot: CombinationsSnapshot = {
  combinations: [],
  current: {
    bundleCount: 0,
    bundles: [],
    createdAt: "",
    creator: "",
    environmentLabel: "",
    name: "",
    status: "运行中",
  },
};

export function getCombinationsRouteConfig(path: string): PageRouteConfig | null {
  if (path !== "/combinations") {
    return null;
  }

  return {
    emptyData: emptyCombinationsSnapshot,
    queryFn: async () => (await import("./api/combinations-snapshot")).fetchCombinationsSnapshot(),
    queryKey: ["combinations-snapshot"],
    render: (snapshot) => <CombinationsPage snapshot={snapshot as CombinationsSnapshot} />,
  };
}
