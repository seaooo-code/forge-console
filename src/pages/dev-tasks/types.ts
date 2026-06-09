export type DevTaskStatus = "待发布" | "已发布" | "已挂起" | "开发中" | "测试中" | "联调中";

export type RelatedModuleStatus = "失败" | "构建中" | "成功";

export type PipelineRunStatus = "failed" | "running" | "success";

export type DevTaskRecord = {
  createdAt: string;
  developer: string;
  id: string;
  moduleBadges: string[];
  moduleCount: number;
  progress: number;
  requirement: string;
  status: DevTaskStatus;
  tester: string;
  title: string;
};

export type RelatedModule = {
  branch: string;
  module: string;
  status: RelatedModuleStatus;
};

export type TaskMember = {
  label: string;
  value: string;
};

export type PipelineRun = {
  duration: string;
  id: string;
  module: string;
  status: PipelineRunStatus;
};

export type FeaturedTask = {
  id: string;
  members: TaskMember[];
  pipelineRuns: PipelineRun[];
  relatedModules: RelatedModule[];
  title: string;
};

export type DevTasksSnapshot = {
  featuredTask: FeaturedTask;
  tasks: DevTaskRecord[];
};
