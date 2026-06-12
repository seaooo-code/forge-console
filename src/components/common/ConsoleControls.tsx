import { type LucideIcon, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type ConsoleFilterOption = {
  label: string;
  value: string;
};

type ConsoleFilterSelectProps = {
  className?: string;
  icon: LucideIcon;
  label: string;
  onValueChange?: (value: string) => void;
  options: ConsoleFilterOption[];
  value: string;
};

type ConsoleSearchInputProps = {
  className?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  value?: string;
};

type ConsoleTableFooterProps = {
  pageSize?: string;
  total: number;
};

export function ConsoleFilterSelect({
  className,
  icon: Icon,
  label,
  onValueChange,
  options,
  value,
}: ConsoleFilterSelectProps) {
  return (
    <Select
      defaultValue={onValueChange ? undefined : value}
      value={onValueChange ? value : undefined}
      onValueChange={onValueChange}
    >
      <SelectTrigger
        className={cn(
          "h-9 w-auto min-w-28 gap-2 border-slate-200 bg-white px-3 font-medium text-slate-600 shadow-sm",
          className,
        )}
        aria-label={`${label}筛选`}
      >
        <Icon className="size-3.5 shrink-0 text-slate-400" />
        <span>{label}</span>
        <SelectValue className="hidden" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ConsoleSearchInput({
  className,
  onChange,
  placeholder = "搜索...",
  value,
}: ConsoleSearchInputProps) {
  return (
    <div
      className={cn(
        "flex h-9 min-w-60 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-slate-500",
        className,
      )}
    >
      <Search className="size-4 shrink-0" />
      <Input
        className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-0"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  );
}

export function ConsoleTableFooter({ pageSize = "20", total }: ConsoleTableFooterProps) {
  return (
    <div className="flex flex-col gap-3 border-slate-200 border-t px-4 py-3 text-slate-500 text-sm md:flex-row md:items-center md:justify-between">
      <span>共 {total} 条</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          type="button"
          size="icon"
          className="size-8 border-slate-200 bg-white text-slate-400"
        >
          ‹
        </Button>
        <Button
          type="button"
          size="icon"
          className="size-8 border border-blue-600 bg-blue-600 font-medium text-white hover:bg-blue-700"
        >
          1
        </Button>
        <Button
          variant="outline"
          type="button"
          size="icon"
          className="size-8 border-slate-200 bg-white text-slate-400"
        >
          ›
        </Button>
        <Select defaultValue={pageSize}>
          <SelectTrigger className="h-8 w-27 border-slate-200 bg-white px-3 text-slate-600 text-xs shadow-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="20">20 条/页</SelectItem>
            <SelectItem value="50">50 条/页</SelectItem>
            <SelectItem value="100">100 条/页</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
