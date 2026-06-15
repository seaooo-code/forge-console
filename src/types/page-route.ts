import type { QueryKey } from "@tanstack/react-query";
import type { ReactNode } from "react";

export type PageRenderOptions = {
  isFetching: boolean;
  navigateTo: (path: string) => void;
  refetch: () => void;
};

export type PageRouteConfig = {
  emptyData: unknown;
  queryFn: () => Promise<unknown>;
  queryKey: QueryKey;
  render: (data: unknown, options: PageRenderOptions) => ReactNode;
};
