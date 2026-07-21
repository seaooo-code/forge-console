import type { ArtifactAccessTokenCreateInput } from "../types";

export type AccessTokenFormState = {
  expiresAt: string;
  name: string;
};

export const defaultAccessTokenForm: AccessTokenFormState = {
  expiresAt: "",
  name: "",
};

export function buildCreateInput(
  form: AccessTokenFormState,
  token: string,
): ArtifactAccessTokenCreateInput {
  const input: ArtifactAccessTokenCreateInput = {
    name: form.name.trim(),
    token,
  };
  if (form.expiresAt) {
    input.expiresAt = new Date(form.expiresAt).toISOString();
  }
  return input;
}

export function isExpired(value: string) {
  if (!value) {
    return false;
  }
  const time = Date.parse(value);
  return Number.isFinite(time) && time <= Date.now();
}

export function formatDisplayTime(value: string) {
  if (!value) {
    return "-";
  }
  const time = Date.parse(value);
  if (!Number.isFinite(time)) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(time));
}
