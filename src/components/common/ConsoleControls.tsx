import { LoaderCircle, type LucideIcon, Search, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";

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

type ConsoleClearableFilterSelectProps = {
  clearLabel: string;
  icon: LucideIcon;
  label: string;
  onClear: () => void;
  onValueChange: (value: string) => void;
  options: ConsoleFilterOption[];
  value: string;
};

export type ConsoleOwnerSearchUser = {
  avatarUrl: string;
  email: string;
  id: string;
  name: string;
};

type ConsoleOwnerSearchFilterProps<TUser extends ConsoleOwnerSearchUser> = {
  className?: string;
  label?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchUsers: (query: string) => Promise<TUser[]>;
  value: string;
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
          "h-9 w-auto min-w-28 gap-2 bg-card px-3 font-medium text-muted-foreground",
          className,
        )}
        aria-label={`${label}筛选`}
      >
        <Icon className="size-3.5 shrink-0 text-muted-foreground" />
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

export function ConsoleClearableFilterSelect({
  clearLabel,
  icon,
  label,
  onClear,
  onValueChange,
  options,
  value,
}: ConsoleClearableFilterSelectProps) {
  return (
    <div className="flex items-center gap-1">
      <ConsoleFilterSelect
        icon={icon}
        label={label}
        value={value}
        options={options}
        onValueChange={onValueChange}
      />
      {value ? (
        <Button
          variant="outline"
          type="button"
          size="icon"
          className="size-9 shrink-0 bg-card text-muted-foreground"
          aria-label={clearLabel}
          onClick={onClear}
        >
          <X className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}

export function ConsoleOwnerSearchFilter<TUser extends ConsoleOwnerSearchUser>({
  className,
  label = "负责人",
  onValueChange,
  placeholder = "搜索姓名、邮箱或账号",
  searchUsers,
  value,
}: ConsoleOwnerSearchFilterProps<TUser>) {
  const [query, setQuery] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [users, setUsers] = useState<TUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (value) {
      return;
    }

    setQuery("");
    setSelectedLabel("");
    setUsers([]);
  }, [value]);

  useEffect(() => {
    const keyword = query.trim();
    if (!isOpen || keyword.length < 2) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    let disposed = false;
    setIsLoading(true);
    const handle = window.setTimeout(() => {
      void searchUsers(keyword)
        .then((result) => {
          if (!disposed) {
            setUsers(result);
          }
        })
        .catch(() => {
          if (!disposed) {
            setUsers([]);
          }
        })
        .finally(() => {
          if (!disposed) {
            setIsLoading(false);
          }
        });
    }, 280);

    return () => {
      disposed = true;
      window.clearTimeout(handle);
    };
  }, [isOpen, query, searchUsers]);

  const buttonLabel = selectedLabel || value || label;

  return (
    <fieldset
      className={cn("relative m-0 min-w-0 border-0 p-0", className)}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
          return;
        }

        window.setTimeout(() => setIsOpen(false), 150);
      }}
    >
      <Button
        variant="outline"
        type="button"
        className="h-9 min-w-28 justify-start gap-2 bg-card px-3 font-medium text-muted-foreground hover:bg-hover hover:text-foreground"
        aria-label={`${label}筛选`}
        onClick={() => {
          setQuery(selectedLabel);
          setIsOpen((current) => !current);
        }}
      >
        <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="max-w-24 truncate">{buttonLabel}</span>
      </Button>

      {isOpen ? (
        <div className="absolute z-30 mt-1 w-72 rounded-xl bg-popover p-2 shadow-raise">
          <div className="flex items-center gap-2">
            <Input
              value={query}
              placeholder={placeholder}
              className="h-8"
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => setIsOpen(true)}
            />
            {value ? (
              <Button
                variant="outline"
                type="button"
                size="icon"
                className="size-8 shrink-0 bg-card text-muted-foreground"
                aria-label={`清空${label}筛选`}
                onClick={() => {
                  setQuery("");
                  setSelectedLabel("");
                  setUsers([]);
                  setIsOpen(false);
                  onValueChange("");
                }}
              >
                <X className="size-3.5" />
              </Button>
            ) : null}
          </div>
          <div className="mt-2 max-h-72 overflow-auto">
            {isLoading ? (
              <div className="flex h-9 items-center gap-2 px-2 text-muted-foreground text-sm">
                <LoaderCircle className="size-4 animate-spin" />
                搜索中
              </div>
            ) : null}
            {!isLoading && query.trim().length >= 2 && users.length === 0 ? (
              <div className="px-2 py-2 text-muted-foreground text-sm">未找到匹配人员</div>
            ) : null}
            {users.map((user) => (
              <Button
                key={user.id}
                variant="ghost"
                type="button"
                className="h-auto w-full justify-start gap-2 rounded-sm px-2 py-2 text-left font-normal"
                onClick={() => {
                  setQuery(user.name);
                  setSelectedLabel(user.name);
                  setIsOpen(false);
                  onValueChange(user.id);
                }}
              >
                <ConsoleOwnerAvatar name={user.name} src={user.avatarUrl} />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground text-sm">
                    {user.name}
                  </span>
                  {user.email ? (
                    <span className="block truncate text-muted-foreground text-xs">
                      {user.email}
                    </span>
                  ) : null}
                </span>
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </fieldset>
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
        "flex h-9 min-w-60 items-center gap-2 rounded-md bg-card px-3 text-muted-foreground shadow-edge",
        className,
      )}
    >
      <Search className="size-4 shrink-0" />
      <Input
        className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </div>
  );
}

function ConsoleOwnerAvatar({ name, src }: { name: string; src: string }) {
  if (src) {
    return <img src={src} alt={name} className="size-7 shrink-0 rounded-full object-cover" />;
  }

  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function ConsoleTableFooter({ pageSize = "20", total }: ConsoleTableFooterProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 text-muted-foreground text-sm md:flex-row md:items-center md:justify-between">
      <span>共 {total} 条</span>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          type="button"
          size="icon"
          className="size-8 bg-card text-muted-foreground"
        >
          ‹
        </Button>
        <Button type="button" size="icon" className="size-8 font-medium">
          1
        </Button>
        <Button
          variant="outline"
          type="button"
          size="icon"
          className="size-8 bg-card text-muted-foreground"
        >
          ›
        </Button>
        <Select defaultValue={pageSize}>
          <SelectTrigger className="h-8 w-27 bg-card px-3 text-muted-foreground text-xs">
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
