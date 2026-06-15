import { lazy } from "react";

import type { PageRouteConfig } from "@/types/page-route";

import type { GraySnapshot } from "./types";

const GrayPage = lazy(async () => ({
  default: (await import("./GrayPage")).GrayPage,
}));

const emptyGraySnapshot: GraySnapshot = {
  histories: [],
  rollouts: [],
  summary: [],
};

export function getGrayRouteConfig(path: string): PageRouteConfig | null {
  if (path !== "/gray") {
    return null;
  }

  return {
    emptyData: emptyGraySnapshot,
    queryFn: async () => (await import("./api/gray-snapshot")).fetchGraySnapshot(),
    queryKey: ["gray-snapshot"],
    render: (snapshot) => <GrayPage snapshot={snapshot as GraySnapshot} />,
  };
}
