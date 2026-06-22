import type { ReleaseRecordStatus, ReleaseRecordType } from "../types";

export const releaseRecordStatusClass: Record<ReleaseRecordStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  inactive: "border-slate-200 bg-slate-50 text-slate-600",
  revoked: "border-red-200 bg-red-50 text-red-600",
};

export const releaseRecordStatusLabels: Record<ReleaseRecordStatus, string> = {
  active: "生效中",
  inactive: "已失效",
  revoked: "已撤销",
};

export const releaseRecordTypeLabels: Record<ReleaseRecordType, string> = {
  full: "全量发布",
  targeted: "标识发布",
};
