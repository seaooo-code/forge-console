import type { MiCarEnvironmentCode } from "@/types/environments";

export type ReleaseEnvironment = Exclude<MiCarEnvironmentCode, "dev">;

export type ReleaseStatus = "待审批" | "已回滚" | "已完成" | "灰度中";

export type ReleaseTimelineStatus = "done" | "pending" | "running";

export type ReleaseTimelineItem = {
  actor: string;
  id: string;
  label: string;
  status: ReleaseTimelineStatus;
  time: string;
};

export type ReleaseFocus = {
  approvalChannels: string;
  approvalStatus: string;
  combination: string;
  combinationDetail: string;
  environmentDetail: string;
  environmentName: string;
  grayDetail: string;
  grayPercent: number;
  id: string;
  owner: string;
  plannedAt: string;
  status: ReleaseStatus;
  title: string;
  timeline: ReleaseTimelineItem[];
};

export type ReleaseRecord = {
  combination: string;
  createdAt: string;
  environment: ReleaseEnvironment;
  gray: string;
  id: string;
  owner: string;
  plannedAt: string;
  status: ReleaseStatus;
  title: string;
};

export type ReleasesSnapshot = {
  focus: ReleaseFocus;
  releases: ReleaseRecord[];
};
