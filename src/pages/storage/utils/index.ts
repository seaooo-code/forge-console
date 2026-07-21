import type { StorageConfigRecord } from "@/types/storage";

import { updateStorageConfiguration } from "../api/storage-snapshot";
import { defaultForm } from "../constants";
import type { StorageFormState, StorageMutationInput } from "../types";

export function buildInitialForm(storage?: StorageConfigRecord): StorageFormState {
  if (!storage) {
    return defaultForm;
  }

  return {
    accessKeyId: "",
    adapter: storage.adapter,
    bucket: storage.bucket,
    endpoint: storage.endpoint,
    name: storage.name,
    owner: storage.owner,
    publicBaseUrl: storage.publicBaseUrl,
    region: storage.region,
    secretAccessKey: "",
    status: storage.status,
  };
}

export function normalizeStorageForm(form: Partial<StorageFormState>): StorageFormState {
  return {
    accessKeyId: form.accessKeyId ?? "",
    adapter: form.adapter ?? "S3",
    bucket: form.bucket ?? "",
    endpoint: form.endpoint ?? "",
    name: form.name ?? "",
    owner: form.owner ?? "",
    publicBaseUrl: form.publicBaseUrl ?? "",
    region: form.region ?? "",
    secretAccessKey: form.secretAccessKey ?? "",
    status: form.status ?? "正常",
  };
}

export function validateStorageInput(input: StorageMutationInput, isEditMode: boolean) {
  if (!input.name || !input.bucket || !input.endpoint) {
    return isEditMode
      ? "请完整填写配置名称、Bucket 与 Endpoint"
      : "请完整填写配置名称、Bucket、Endpoint 与访问密钥";
  }

  if (!isEditMode && (!input.accessKeyId || !input.secretAccessKey)) {
    return "请完整填写配置名称、Bucket、Endpoint 与访问密钥";
  }

  return "";
}

export function buildStorageTestSignature(input: StorageMutationInput) {
  return JSON.stringify(input);
}

export function buildStorageMutationInput(form: StorageFormState): StorageMutationInput {
  return {
    accessKeyId: form.accessKeyId.trim(),
    adapter: form.adapter,
    bucket: form.bucket.trim(),
    endpoint: form.endpoint.trim(),
    name: form.name.trim(),
    owner: form.owner.trim(),
    publicBaseUrl: form.publicBaseUrl.trim(),
    region: form.region.trim(),
    secretAccessKey: form.secretAccessKey.trim(),
    status: form.status,
  };
}

export async function updateExistingStorageConfiguration(
  storageId: string | undefined,
  input: StorageMutationInput,
) {
  if (!storageId) {
    throw new Error("Storage id is required");
  }

  return updateStorageConfiguration(storageId, input);
}
