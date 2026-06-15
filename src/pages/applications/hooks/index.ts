import { useQuery } from "@tanstack/react-query";

import { applicationOptionsQueryKey } from "../api/application-list-filters";
import { fetchApplicationOptions } from "../api/applications-snapshot";

export function useApplicationOptions() {
  return useQuery({
    queryFn: fetchApplicationOptions,
    queryKey: applicationOptionsQueryKey,
    staleTime: 5 * 60 * 1000,
  });
}
