export type StorageAdapter = "S3";

export type StorageStatus = "正常" | "异常" | "已停用";

export type StorageAdapterOption = {
  label: string;
  value: StorageAdapter;
};

export type StorageConfigRecord = {
  adapter: StorageAdapter;
  bucket: string;
  endpoint: string;
  id: string;
  lastVerifiedAt: string;
  name: string;
  owner: string;
  publicBaseUrl: string;
  region: string;
  status: StorageStatus;
};

export type StorageSnapshot = {
  configurations: StorageConfigRecord[];
};

export type StorageMutationInput = {
  accessKeyId: string;
  adapter: StorageAdapter;
  bucket: string;
  endpoint: string;
  name: string;
  owner: string;
  publicBaseUrl: string;
  region: string;
  secretAccessKey: string;
  status: StorageStatus;
};

export type StorageTestResult = {
  ok: boolean;
  testedAt: string;
};
