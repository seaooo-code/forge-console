import type { PipelineStatus } from "../types";

export function getStatusLabel(status: PipelineStatus) {
  const labels: Record<PipelineStatus, string> = {
    healthy: "Healthy",
    warning: "Watch",
    blocked: "Blocked",
  };

  return labels[status];
}
