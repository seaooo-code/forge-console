import { Link } from "react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { metricIcons, resourceStatusClass } from "../constants";
import type { ResourceStatus } from "../types";

const resourceIcons: Record<string, keyof typeof metricIcons> = {
  "access-tokens": "accessToken",
  apps: "app",
  "code-sources": "codeSource",
  environments: "environment",
  modules: "module",
  storage: "storage",
};

type ResourceOverviewPanelProps = {
  resources: ResourceStatus[];
};

export function ResourceOverviewPanel({ resources }: ResourceOverviewPanelProps) {
  return (
    <Card className="gap-0 rounded-lg border-slate-200 py-0 shadow-sm">
      <CardHeader className="h-12 border-b px-4 py-0">
        <CardTitle className="flex h-full items-center text-slate-900 text-sm">平台资源</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 px-4 py-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {resources.map((resource) => {
          const Icon = metricIcons[resourceIcons[resource.id] ?? "storage"];

          return (
            <Link
              key={resource.id}
              to={resource.href}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 transition-colors hover:border-blue-200 hover:bg-blue-50/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-900 text-sm">
                      {resource.label}
                    </div>
                    <div className="mt-1 truncate text-slate-500 text-xs">
                      {resource.description}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded border px-2 py-0.5 font-medium text-xs",
                    resourceStatusClass[resource.status],
                  )}
                >
                  {resource.statusLabel}
                </span>
              </div>
              <div className="mt-3 font-semibold text-2xl text-slate-900">{resource.value}</div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
