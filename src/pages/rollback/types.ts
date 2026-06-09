export type RollbackEnvironment = "dev" | "pre" | "prod" | "test";

export type RollbackRisk = "low" | "med";

export type RollbackCombinationStatus = "已回滚" | "可回滚" | "运行中";

export type RollbackEnvironmentState = {
  currentCombination: string;
  environment: RollbackEnvironment;
  id: string;
  onlineUsers: string;
  since: string;
};

export type RollbackHistoryCombination = {
  createdAt: string;
  description: string;
  id: string;
  isCurrent: boolean;
  isSelected: boolean;
  name: string;
  risk: RollbackRisk;
  status: RollbackCombinationStatus;
};

export type RollbackImpactChange = {
  currentVersion: string;
  module: string;
  targetVersion: string;
};

export type RollbackImpactPreview = {
  affectedUsers: string;
  cdnTraffic: string;
  changes: RollbackImpactChange[];
  downloadSize: string;
  selectedCombination: string;
};

export type RollbackRecord = {
  affected: string;
  environment: RollbackEnvironment;
  fromCombination: string;
  operator: string;
  reason: string;
  targetCombination: string;
  time: string;
};

export type RollbackSnapshot = {
  environments: RollbackEnvironmentState[];
  histories: RollbackHistoryCombination[];
  impact: RollbackImpactPreview;
  records: RollbackRecord[];
};
