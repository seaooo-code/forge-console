import { type APIErrorPayload, createFetchClient } from "@/api/client";
import type { GlobalEnums } from "@/types/enums";

export const globalEnumsQueryKey = ["global-enums"] as const;

export class GlobalEnumsAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(payload?.error || `Request ${path} failed with ${status}`);
    this.name = "GlobalEnumsAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const fetchJSON = createFetchClient(
  (path, status, payload) => new GlobalEnumsAPIError(path, status, payload),
);

export async function fetchGlobalEnums(): Promise<GlobalEnums> {
  return fetchJSON<GlobalEnums>("/api/v1/enums");
}
