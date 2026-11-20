import type { TestPlanEventRecord, TestPlanRecord } from "../api";

export const testPlanStatusLabels: Record<TestPlanRecord["status"], string> = {
  closed: "已关闭",
  expired: "已过期",
  open: "进行中",
};

export const testPlanStatusClass: Record<TestPlanRecord["status"], string> = {
  closed: "bg-muted text-muted-foreground",
  expired: "bg-warning/14 text-warning-foreground dark:text-warning",
  open: "bg-success/12 text-success",
};

export const testPlanItemModeLabels = {
  follow: "跟随分支",
  pinned: "固定构建",
} as const;

export const testPlanStatusFilterOptions = [
  { label: "进行中", value: "open" },
  { label: "已结束", value: "closed" },
];

/** 新建和延长时可选的有效期（天），后端上限 30 天。 */
export const testPlanTtlDayOptions = ["1", "3", "7", "14", "30"];

export const testPlanEventLabels: Record<TestPlanEventRecord["kind"], string> = {
  closed: "关闭了提测单",
  created: "创建了提测单",
  extended: "修改了有效期",
  item_deleted: "移除了条目",
  item_followed: "分支有新构建，条目自动更新",
  item_set: "设置了条目",
  member_added: "添加了成员",
  member_removed: "移除了成员",
  member_removed_by_conflict: "成员因加入其他提测单被移出",
  updated: "修改了名称或链接",
};
