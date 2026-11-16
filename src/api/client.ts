import type { components } from "@/api/openapi";

/** 后端 OpenAPI schema 生成的接口类型，由 `bun run gen:api` 更新。 */
export type APISchemas = components["schemas"];

export type APIErrorPayload = {
  error?: string;
  /** 部分接口返回的可读失败原因，例如存储连通性测试。 */
  detail?: string;
};

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

export async function readErrorPayload(response: Response): Promise<APIErrorPayload | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  try {
    return (await response.json()) as APIErrorPayload;
  } catch {
    return undefined;
  }
}

type FetchErrorFactory = (path: string, status: number, payload?: APIErrorPayload) => Error;

export function createFetchClient(
  createError: FetchErrorFactory,
  options?: { allowEmpty?: boolean },
) {
  return async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      credentials: "include",
      ...init,
      headers: init?.body
        ? {
            "Content-Type": "application/json",
            ...init.headers,
          }
        : init?.headers,
    });

    if (!response.ok) {
      const payload = await readErrorPayload(response);
      throw createError(path, response.status, payload);
    }

    if (
      options?.allowEmpty &&
      (response.status === 204 ||
        !response.headers.get("content-type")?.includes("application/json"))
    ) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  };
}
