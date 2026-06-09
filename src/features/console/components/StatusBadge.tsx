import { Badge } from "@/components/ui/badge";

import { getStatusLabel } from "../model/status";
import type { PipelineStatus } from "../types";

type StatusBadgeProps = {
  status: PipelineStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "healthy") {
    return <Badge variant="success">{getStatusLabel(status)}</Badge>;
  }

  if (status === "warning") {
    return <Badge variant="warning">{getStatusLabel(status)}</Badge>;
  }

  return <Badge variant="destructive">{getStatusLabel(status)}</Badge>;
}
