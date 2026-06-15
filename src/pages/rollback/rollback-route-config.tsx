import { lazy } from "react";

import type { PageRouteConfig } from "@/types/page-route";

import type { RollbackSnapshot } from "./types";

const RollbackPage = lazy(async () => ({
  default: (await import("./RollbackPage")).RollbackPage,
}));

const emptyRollbackSnapshot: RollbackSnapshot = {
  environments: [],
  histories: [],
  impact: {
    affectedUsers: "",
    cdnTraffic: "",
    changes: [],
    downloadSize: "",
    selectedCombination: "",
  },
  records: [],
};

export function getRollbackRouteConfig(path: string): PageRouteConfig | null {
  if (path !== "/rollback") {
    return null;
  }

  return {
    emptyData: emptyRollbackSnapshot,
    queryFn: async () => (await import("./api/rollback-snapshot")).fetchRollbackSnapshot(),
    queryKey: ["rollback-snapshot"],
    render: (snapshot) => <RollbackPage snapshot={snapshot as RollbackSnapshot} />,
  };
}
