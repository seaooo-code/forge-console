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
