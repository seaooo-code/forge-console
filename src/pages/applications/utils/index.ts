import { applicationStatusCodes } from "../constants";
import type { ApplicationStatusCode } from "../types";

export function parseApplicationStatusCode(
  value: string | undefined,
): ApplicationStatusCode | null {
  if (!value) {
    return null;
  }

  return applicationStatusCodes.has(value as ApplicationStatusCode)
    ? (value as ApplicationStatusCode)
    : null;
}
