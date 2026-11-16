import { Badge } from "@/components/ui/badge";

import { buildAdapterStatusBadgeVariant, buildAdapterStatusLabels } from "../constants";
import type { BuildAdapterStatus } from "../types";

export function BuildAdapterStatusBadge({ status }: { status: BuildAdapterStatus }) {
  return (
    <Badge variant={buildAdapterStatusBadgeVariant[status]}>
      {buildAdapterStatusLabels[status]}
    </Badge>
  );
}
