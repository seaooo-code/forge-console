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
    ownerAvatarUrl: storage.ownerAvatarUrl,
    ownerEmail: storage.ownerEmail,
    ownerFeishuOpenId: "",
    ownerFeishuUnionId: "",
    ownerFeishuUserId: "",
    ownerUserId: storage.ownerUserId,
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
    ownerAvatarUrl: form.ownerAvatarUrl ?? "",
    ownerEmail: form.ownerEmail ?? "",
    ownerFeishuOpenId: form.ownerFeishuOpenId ?? "",
    ownerFeishuUnionId: form.ownerFeishuUnionId ?? "",
    ownerFeishuUserId: form.ownerFeishuUserId ?? "",
    ownerUserId: form.ownerUserId ?? "",
    publicBaseUrl: form.publicBaseUrl ?? "",
    region: form.region ?? "",
    secretAccessKey: form.secretAccessKey ?? "",
    status: form.status ?? "healthy",
  };
}

export function validateStorageInput(input: StorageMutationInput, isEditMode: boolean) {
  if (!input.name || !input.bucket || !input.region || !input.endpoint) {
    return isEditMode
      ? "请完整填写配置名称、Bucket、Region 与 Endpoint"
      : "请完整填写配置名称、Bucket、Region、Endpoint 与访问密钥";
  }

  if (!isEditMode && (!input.accessKeyId || !input.secretAccessKey)) {
    return "请完整填写配置名称、Bucket、Region、Endpoint 与访问密钥";
  }

  // 编辑时两个密钥都留空表示沿用已保存的密钥；只填一个会被后端拒绝。
  if (isEditMode && !input.accessKeyId !== !input.secretAccessKey) {
    return "更新访问密钥时需同时填写 Access Key ID 与 Secret Access Key";
  }

  if (!input.owner || !input.ownerUserId) {
    return "请从搜索结果中选择负责人";
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
    ownerAvatarUrl: form.ownerAvatarUrl.trim(),
    ownerEmail: form.ownerEmail.trim(),
    ownerFeishuOpenId: form.ownerFeishuOpenId.trim(),
    ownerFeishuUnionId: form.ownerFeishuUnionId.trim(),
    ownerFeishuUserId: form.ownerFeishuUserId.trim(),
    ownerUserId: form.ownerUserId.trim(),
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
