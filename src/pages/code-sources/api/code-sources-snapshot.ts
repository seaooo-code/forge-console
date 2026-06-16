import type {
  CodeSourceAppManifest,
  CodeSourceInstallURL,
  CodeSourceProvider,
  CodeSourcesSnapshot,
} from "../types";

export const codeSourcesSnapshotQueryKey = ["code-sources-snapshot"] as const;

type APIErrorPayload = {
  error?: string;
};

export class CodeSourceAPIError extends Error {
  readonly payload?: APIErrorPayload;
  readonly status: number;

  constructor(path: string, status: number, payload?: APIErrorPayload) {
    super(payload?.error || `Request ${path} failed with ${status}`);
    this.name = "CodeSourceAPIError";
    this.payload = payload;
    this.status = status;
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080").replace(
  /\/+$/,
  "",
);

export async function fetchCodeSourcesSnapshot(): Promise<CodeSourcesSnapshot> {
  const payload = await fetchJSON<CodeSourcesSnapshot>("/api/v1/code-sources");

  return {
    apps: payload.apps.map((app) => ({
      ...app,
      installedAt: formatInstalledAt(app.installedAt),
    })),
  };
}

export async function fetchCodeSourceInstallURL(
  provider: CodeSourceProvider,
): Promise<CodeSourceInstallURL> {
  return fetchJSON<CodeSourceInstallURL>(
    `/api/v1/code-sources/${encodeURIComponent(provider)}/install-url`,
  );
}

export async function fetchCodeSourceAppManifest(
  provider: CodeSourceProvider,
): Promise<CodeSourceAppManifest> {
  return fetchJSON<CodeSourceAppManifest>(
    `/api/v1/code-sources/${encodeURIComponent(provider)}/manifest`,
  );
}

export async function deleteCodeSourceInstallations(provider: CodeSourceProvider): Promise<void> {
  await fetchJSON<void>(`/api/v1/code-sources/${encodeURIComponent(provider)}/installations`, {
    method: "DELETE",
  });
}

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
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
    throw new CodeSourceAPIError(path, response.status, payload);
  }

  if (
    response.status === 204 ||
    !response.headers.get("content-type")?.includes("application/json")
  ) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function readErrorPayload(response: Response): Promise<APIErrorPayload | undefined> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return undefined;
  }

  try {
    return (await response.json()) as APIErrorPayload;
  } catch (_error) {
    return undefined;
  }
}

function formatInstalledAt(value?: string) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(date);
}
