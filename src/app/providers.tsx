import { QueryClientProvider } from "@tanstack/react-query";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import type { PropsWithChildren } from "react";

import { queryClient } from "@/lib/query-client";

ModuleRegistry.registerModules([AllCommunityModule]);

export function AppProviders({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
