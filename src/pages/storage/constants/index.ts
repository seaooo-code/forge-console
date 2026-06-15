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
  S3: "bg-blue-600 text-white",
};

export const statusClass: Record<StorageStatus, string> = {
  已停用: "border-slate-200 bg-slate-50 text-slate-600",
  异常: "border-red-200 bg-red-50 text-red-600",
  正常: "border-emerald-200 bg-emerald-50 text-emerald-700",
};
