import { Bell, CircleHelp, RefreshCw, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TopToolbarProps = {
  isFetching: boolean;
  onRefresh: () => void;
};

export function TopToolbar({ isFetching, onRefresh }: TopToolbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-18 items-center justify-between gap-4 border-slate-200 border-b bg-white/95 px-6 backdrop-blur">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 min-w-65 max-w-130 flex-1 items-center gap-2 rounded-md bg-slate-100 px-3 text-slate-500">
          <Search className="size-4 shrink-0" />
          <Input
            className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-0"
            placeholder="搜索 任务 / 模块 / Bundle / 发布单 ..."
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="高级筛选">
          <SlidersHorizontal className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="帮助">
          <CircleHelp className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="通知">
          <Bell className="size-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="刷新" onClick={onRefresh}>
          <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
        </Button>
        <div className="flex items-center gap-2 pl-2">
          <div className="flex size-9 items-center justify-center rounded-full bg-rose-500 font-semibold text-white text-sm">
            ZW
          </div>
          <div className="hidden leading-tight xl:block">
            <div className="font-semibold text-slate-800 text-sm">zhang.wei</div>
            <div className="text-slate-500 text-xs">RN Platform · Admin</div>
          </div>
        </div>
      </div>
    </header>
  );
}
