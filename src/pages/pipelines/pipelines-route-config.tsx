import { lazy } from "react";

import type { PageRouteConfig } from "@/types/page-route";

import type { PipelinesSnapshot } from "./types";

const PipelinesPage = lazy(async () => ({
  default: (await import("./PipelinesPage")).PipelinesPage,
}));

const emptyPipelinesSnapshot: PipelinesSnapshot = {
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

export function getPipelinesRouteConfig(path: string): PageRouteConfig | null {
  if (path !== "/pipelines") {
    return null;
  }

  return {
    emptyData: emptyPipelinesSnapshot,
    queryFn: async () => (await import("./api/pipelines-snapshot")).fetchPipelinesSnapshot(),
    queryKey: ["pipelines-snapshot"],
    render: (snapshot) => <PipelinesPage snapshot={snapshot as PipelinesSnapshot} />,
  };
}
