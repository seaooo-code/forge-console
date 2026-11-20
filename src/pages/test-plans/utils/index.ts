import type { TestPlanEventRecord } from "../api";
import { testPlanEventLabels } from "../constants";

export function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(date);
}

/** 有效期还剩多久，例如「剩 3 天」「剩 5 小时」；已过期返回空字符串。 */
export function formatRemaining(expiresAt: string, now = Date.now()) {
  const remaining = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(remaining) || remaining <= 0) {
    return "";
  }
  const hours = Math.floor(remaining / 3_600_000);
  return hours >= 24
    ? `剩 ${Math.round(remaining / 86_400_000)} 天`
    : `剩 ${Math.max(hours, 1)} 小时`;
}

export function expiresAtAfterDays(days: string) {
  return new Date(Date.now() + Number(days) * 24 * 3_600_000).toISOString();
}

export function shortSha(sha: string) {
  return sha.slice(0, 8);
}

/** 操作记录的一行说明：动作 + 关键字段。 */
export function describeTestPlanEvent(event: TestPlanEventRecord) {
  const detail = event.detail as Record<string, unknown>;
  const label = testPlanEventLabels[event.kind] ?? event.kind;
  const text = (key: string) => (typeof detail[key] === "string" ? (detail[key] as string) : "");
  switch (event.kind) {
    case "item_set":
      return `${label}：${text("moduleId")} · ${text("branch")}`;
    case "item_deleted":
      return `${label}：${text("moduleId")}`;
    case "item_followed":
      return `${label}：${text("moduleId")} · ${text("branch")} #${String(detail.buildNumber ?? "")}`;
    case "member_added":
    case "member_removed":
      return `${label}：${text("userId")}`;
    case "member_removed_by_conflict":
      return `${label}：${text("userId")} 加入了「${text("causedByTestPlanName")}」`;
    case "extended":
      return `${label}：${formatDateTime(text("expiresAt"))}`;
    default:
      return label;
  }
}
