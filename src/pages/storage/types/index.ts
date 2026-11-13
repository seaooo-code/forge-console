import type { APISchemas } from "@/api/client";
import type { StorageAdapter, StorageStatus } from "@/types/storage";

export type StorageAdapterOption = {
  label: string;
  value: StorageAdapter;
};

export type StorageMutationInput = APISchemas["StorageConfigurationCreateRequest"];

export type StorageTestResult = APISchemas["StorageConfigurationTestResponse"];

export type StorageFormState = {
  accessKeyId: string;
  adapter: StorageAdapter;
  bucket: string;
  endpoint: string;
  name: string;
  owner: string;
  ownerAvatarUrl: string;
  ownerEmail: string;
  ownerFeishuOpenId: string;
  ownerFeishuUnionId: string;
  ownerFeishuUserId: string;
  ownerUserId: string;
  publicBaseUrl: string;
  region: string;
  secretAccessKey: string;
  status: StorageStatus;
};
