import type { StorageAdapter, StorageStatus } from "@/types/storage";

export type StorageAdapterOption = {
  label: string;
  value: StorageAdapter;
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

export type StorageFormState = {
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
