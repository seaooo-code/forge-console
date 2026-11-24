import type { ReleasePointerRecord, ReleaseRecordStatus, ReleaseRecordType } from "../types";

export const releaseRecordStatusClass: Record<ReleaseRecordStatus, string> = {
  active: "bg-success/12 text-success",
  inactive: "bg-muted text-muted-foreground",
};

export const releaseRecordStatusLabels: Record<ReleaseRecordStatus, string> = {
  active: "生效中",
  inactive: "已失效",
};

export const releaseRecordTypeLabels: Record<ReleaseRecordType, string> = {
  full: "全量",
  gray: "灰度",
};

export function getReleaseRecordTypeLabel(
  record: Pick<ReleasePointerRecord, "grayPercentage" | "grayStrategy" | "releaseType">,
) {
  if (record.releaseType !== "gray") {
    return "全量";
  }

  if (record.grayStrategy === "targeted") {
    return "定向（已停用）";
  }
  if (record.grayStrategy === "percentage") {
    return "比例灰度";
  }
  return "灰度";
}

export function getReleaseRecordTargetLabel(
  record: Pick<ReleasePointerRecord, "grayPercentage" | "grayStrategy" | "releaseType">,
) {
  if (record.releaseType !== "gray") {
    return "默认访问路由";
  }

  if (record.grayStrategy === "targeted") {
    return "定向（已停用）";
  }
  if (record.grayStrategy === "percentage") {
    return `比例 ${record.grayPercentage}%`;
  }
  return "灰度";
}

/** 发布健康状态的文案和样式，状态含义见 forge-server/docs/release-health.md 第 5 节。 */
export const releaseHealthStatusMeta: Record<
  "no_reports" | "insufficient_data" | "healthy" | "unhealthy",
  { className: string; label: string }
> = {
  healthy: { className: "bg-success/12 text-success", label: "健康" },
  insufficient_data: { className: "bg-muted text-muted-foreground", label: "样本不足" },
  no_reports: { className: "bg-warning/14 text-warning", label: "无上报" },
  unhealthy: { className: "bg-destructive-soft text-destructive", label: "异常" },
};
