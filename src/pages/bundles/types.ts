export type BundleStatus = "已发布" | "已归档" | "已驳回" | "草稿";

export type BundleRecord = {
  build: string;
  branch: string;
  commit: string;
  createdAt: string;
  creator: string;
  environments: string[];
  module: string;
  sizeKb: number;
  status: BundleStatus;
  version: string;
};

export type BundlesSnapshot = {
  bundles: BundleRecord[];
};
