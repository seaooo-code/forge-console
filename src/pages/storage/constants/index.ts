import type { StorageAdapter, StorageStatus } from "@/types/storage";

import type { StorageAdapterOption, StorageFormState } from "../types";

export const defaultForm: StorageFormState = {
  accessKeyId: "",
  adapter: "S3",
  bucket: "",
  endpoint: "",
  forcePathStyle: false,
  name: "",
  owner: "",
  ownerAvatarUrl: "",
  ownerEmail: "",
  ownerFeishuOpenId: "",
  ownerFeishuUnionId: "",
  ownerFeishuUserId: "",
  ownerUserId: "",
  publicBaseUrl: "",
  region: "",
  secretAccessKey: "",
  status: "healthy",
};

export const storageAdapterOptions: StorageAdapterOption[] = [
  {
    label: "S3",
    value: "S3",
  },
];

export const adapterToneClass: Record<StorageAdapter, string> = {
  S3: "bg-primary text-primary-foreground",
};

export const statusClass: Record<StorageStatus, string> = {
  disabled: "bg-muted text-muted-foreground",
  error: "bg-destructive-soft text-destructive",
  healthy: "bg-success/12 text-success",
};

export const statusLabel: Record<StorageStatus, string> = {
  disabled: "已停用",
  error: "异常",
  healthy: "正常",
};
