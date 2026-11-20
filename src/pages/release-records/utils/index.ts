import type { LucideIcon } from "lucide-react";
import { Circle, Rocket, ShieldCheck } from "lucide-react";

import type { ReleaseRecordsSnapshot } from "../types";

export type ReleaseRecordsStat = {
  detail: string;
  icon: LucideIcon;
  id: string;
  label: string;
  tone: "info" | "success" | "muted";
  value: number;
};

export function buildReleaseRecordsStats(
  overviewSnapshot: ReleaseRecordsSnapshot | undefined,
): ReleaseRecordsStat[] {
  if (!overviewSnapshot) {
    return [];
  }

  return [
    {
      detail: "全部发布记录",
      icon: Rocket,
      id: "total",
      label: "总发布",
      tone: "info",
      value: overviewSnapshot.summary.total,
    },
    {
      detail: "当前可访问",
      icon: ShieldCheck,
      id: "active",
      label: "生效中",
      tone: "success",
      value: overviewSnapshot.summary.active,
    },
    {
      detail: "已被替换",
      icon: Circle,
      id: "inactive",
      label: "已失效",
      tone: "muted",
      value: overviewSnapshot.summary.inactive,
    },
  ];
}

export function formatShortRecordID(value: string) {
  const normalized = value.trim();
  return normalized ? `#${normalized.slice(-8)}` : "-";
}
