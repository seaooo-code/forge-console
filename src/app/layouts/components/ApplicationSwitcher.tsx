import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";

import { applicationScopeOptionsQueryKey, fetchApplicationScopeOptions } from "@/api/applications";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useApplicationScopeStore } from "@/store/use-application-scope-store";

/** 全站共用的「当前应用」。页面通过 URL 的 applicationId 与 store 同步，这里两处一起改。 */
export function ApplicationSwitcher() {
  const [open, setOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const applicationId = useApplicationScopeStore((state) => state.applicationId);
  const setApplicationId = useApplicationScopeStore((state) => state.setApplicationId);
  const { data: applications = [] } = useQuery({
    queryFn: fetchApplicationScopeOptions,
    queryKey: applicationScopeOptionsQueryKey,
  });
  const current = applications.find((application) => application.id === applicationId);

  const select = (nextApplicationId: string) => {
    setApplicationId(nextApplicationId);
    if (searchParams.has("applicationId")) {
      setSearchParams((params) => {
        const next = new URLSearchParams(params);
        if (nextApplicationId) {
          next.set("applicationId", nextApplicationId);
        } else {
          next.delete("applicationId");
        }
        return next;
      });
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          type="button"
          className="h-auto w-full justify-start gap-2.5 rounded-lg bg-background px-2.5 py-2 text-left shadow-edge hover:bg-hover"
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-foreground font-medium text-background text-xs">
            {current ? current.name.slice(0, 1) : "全"}
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate font-medium text-foreground text-sm">
              {current?.name ?? "全部应用"}
            </span>
            <span className="block truncate font-normal text-faint text-xs">
              {current ? current.slug : `${applications.length} 个应用`}
            </span>
          </span>
          <ChevronsUpDown className="text-faint" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 rounded-xl border-0 p-1.5 shadow-raise"
        sideOffset={6}
      >
        <div className="px-2 pt-1 pb-1.5 text-faint text-xs">当前应用</div>
        {[{ id: "", name: "全部应用", slug: "" }, ...applications].map((application) => {
          const selected = application.id === applicationId;
          return (
            <Button
              key={application.id || "all"}
              variant="ghost"
              type="button"
              onClick={() => select(application.id)}
              className={cn(
                "h-8 w-full justify-start gap-2 rounded-md px-2 font-normal text-sm",
                selected ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="min-w-0 flex-1 truncate text-left">{application.name}</span>
              {selected ? <Check className="text-primary" /> : null}
            </Button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
