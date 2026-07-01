import type { StorageAdapter, StorageStatus } from "@/types/storage";

import type { StorageAdapterOption, StorageFormState } from "../types";

export const defaultForm: StorageFormState = {
  accessKeyId: "",
  adapter: "S3",
  bucket: "",
  endpoint: "",
  name: "",
  owner: "rn-platform",
  publicBaseUrl: "",
  region: "",
  secretAccessKey: "",
  status: "正常",
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
  已停用: "border-border bg-muted text-muted-foreground",
  异常: "border-destructive/30 bg-destructive/10 text-destructive",
  正常: "border-success/30 bg-success/10 text-success",
};
