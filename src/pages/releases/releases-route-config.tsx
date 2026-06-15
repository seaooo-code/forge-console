import { lazy } from "react";

import type { PageRouteConfig } from "@/types/page-route";

import type { ReleasesSnapshot } from "./types";

const ReleasesPage = lazy(async () => ({
  default: (await import("./ReleasesPage")).ReleasesPage,
}));

const emptyReleasesSnapshot: ReleasesSnapshot = {
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
    timeline: [],
    title: "",
  },
  releases: [],
};

export function getReleasesRouteConfig(path: string): PageRouteConfig | null {
  if (path !== "/releases") {
    return null;
  }

  return {
    emptyData: emptyReleasesSnapshot,
    queryFn: async () => (await import("./api/releases-snapshot")).fetchReleasesSnapshot(),
    queryKey: ["releases-snapshot"],
    render: (snapshot) => <ReleasesPage snapshot={snapshot as ReleasesSnapshot} />,
  };
}
