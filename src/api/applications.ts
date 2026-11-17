import { type APISchemas, createFetchClient } from "@/api/client";
import { fetchAllPaginatedItems } from "@/api/pagination";

type ApplicationsAPIResponse = APISchemas["ApplicationsResponse"];

export type ApplicationScopeOption = Pick<
  APISchemas["Application"],
  "id" | "moduleCount" | "name" | "slug"
>;

/** 挂在应用列表的根 key 下，应用增删改后随应用列表一起失效。 */
export const applicationScopeOptionsQueryKey = ["applications-snapshot", "scope-options"] as const;

const fetchJSON = createFetchClient(
  (path, status, payload) => new Error(payload?.error ?? `Request ${path} failed with ${status}`),
);

/** 侧栏「当前应用」和线上现状共用的应用清单，只取切换需要的字段。 */
export async function fetchApplicationScopeOptions(): Promise<ApplicationScopeOption[]> {
  const { items } = await fetchAllPaginatedItems(
    ({ page, pageSize }) =>
      fetchJSON<ApplicationsAPIResponse>(`/api/v1/applications?page=${page}&pageSize=${pageSize}`),
    (payload) => payload.applications,
  );

  return items.map(({ id, moduleCount, name, slug }) => ({ id, moduleCount, name, slug }));
}
