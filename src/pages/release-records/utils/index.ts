import type { LucideIcon } from "lucide-react";
import { Circle, Rocket, ShieldCheck } from "lucide-react";

import type { ReleaseEvent, ReleaseRecordsSnapshot } from "../types";

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

/** 发布操作记录的一行说明。detail 字段见后端 ReleaseEvent。 */
export function describeReleaseEvent(event: ReleaseEvent) {
  const detail = event.detail as Record<string, unknown>;
  switch (event.kind) {
    case "created": {
      const target =
        detail.releaseType === "gray" ? `比例灰度 ${String(detail.grayPercentage ?? 0)}%` : "全量";
      return detail.rollbackFromReleaseId
        ? `回滚发布为${target}（回滚自 #${String(detail.rollbackFromReleaseId).slice(-8)}）`
        : `发布为${target}`;
    }
    case "gray_percentage_updated":
      return `灰度比例 ${String(detail.from)}% → ${String(detail.to)}%`;
    case "promoted_to_full":
      return `从 ${String(detail.fromPercentage)}% 灰度转为全量`;
    case "replaced":
      return `被新发布 #${String(detail.byReleaseId ?? "").slice(-8)} 替换`;
    case "deactivated":
      return detail.reason ? `停用：${String(detail.reason)}` : "停用";
    default:
      return event.kind;
  }
}
