export type GrayStatus = "已全量" | "推进中";

export type GraySummaryItem = {
  detail: string;
  id: string;
  label: string;
  value: string;
};

export type GrayMetric = {
  label: string;
  value: string;
};

export type GrayRollout = {
  audience: string;
  errorTrend: number[];
  health: string;
  id: string;
  jsErrorRate: string;
  p99: string;
  percent: number;
  releaseId: string;
  startAt: string;
  status: GrayStatus;
  title: string;
  metrics: GrayMetric[];
};

export type GrayHistoryRecord = {
  action: "回滚" | "全量" | "推进";
  after: string;
  before: string;
  id: string;
  note: string;
  operator: string;
  releaseId: string;
  time: string;
};

export type GraySnapshot = {
  histories: GrayHistoryRecord[];
  rollouts: GrayRollout[];
  summary: GraySummaryItem[];
};
