import { skipToken, useQuery } from "@tanstack/react-query";
import { GitBranch, LoaderCircle } from "lucide-react";
import { type KeyboardEvent, useState } from "react";

import { moduleBranchesQueryKey, searchModuleBranches } from "@/api/modules";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";

type BranchPickerProps = {
  defaultBranch?: string;
  id?: string;
  invalid?: boolean;
  moduleId: string;
  onBlur?: () => void;
  onChange: (value: string) => void;
  value: string;
};

/**
 * 输入框 + 分支候选列表：按输入关键词搜索模块仓库的分支，点击或回车选中。
 * 搜不到时（例如分支太多超出返回上限）仍可直接输入分支名提交。
 */
export function BranchPicker({
  defaultBranch,
  id,
  invalid,
  moduleId,
  onBlur,
  onChange,
  value,
}: BranchPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  // 打开后还没输入时列出全部分支，避免输入框里的当前值把候选过滤成一条。
  const [hasTyped, setHasTyped] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const query = useDebouncedValue(hasTyped ? value.trim() : "");
  const shouldSearch = isOpen && moduleId !== "";
  const {
    data: branches = [],
    error,
    isFetching,
  } = useQuery({
    queryFn: shouldSearch ? () => searchModuleBranches(moduleId, query) : skipToken,
    queryKey: moduleBranchesQueryKey(moduleId, query),
    retry: false,
    staleTime: 30_000,
  });

  const open = () => {
    setIsOpen(true);
    setHasTyped(false);
    setActiveIndex(-1);
  };

  const close = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const selectBranch = (branch: string) => {
    onChange(branch);
    close();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!shouldSearch) {
      if (event.key === "ArrowDown") {
        open();
      }
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (branches.length === 0) {
        return;
      }
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (index + step + branches.length) % branches.length);
    } else if (event.key === "Enter") {
      const branch = branches[activeIndex];
      if (branch) {
        // 有高亮候选时回车只选中分支，不提交表单。
        event.preventDefault();
        selectBranch(branch);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  return (
    <div className="relative">
      <Input
        id={id}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={shouldSearch}
        aria-invalid={invalid || undefined}
        autoComplete="off"
        value={value}
        disabled={!moduleId}
        placeholder={moduleId ? "搜索或输入 Git 分支" : "请先选择模块"}
        onBlur={() => {
          onBlur?.();
          window.setTimeout(close, 150);
        }}
        onChange={(event) => {
          onChange(event.target.value);
          setIsOpen(true);
          setHasTyped(true);
          setActiveIndex(-1);
        }}
        onClick={() => {
          if (!isOpen) {
            open();
          }
        }}
        onFocus={open}
        onKeyDown={handleKeyDown}
      />
      {shouldSearch ? (
        <div
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl bg-popover p-1 shadow-raise"
        >
          {isFetching ? (
            <div className="flex h-10 items-center gap-2 px-3 text-muted-foreground text-sm">
              <LoaderCircle className="size-4 animate-spin" />
              搜索中
            </div>
          ) : null}
          {!isFetching && error ? (
            <div className="px-3 py-2 text-destructive text-sm">
              {error instanceof Error ? error.message : "分支搜索失败，请检查代码源连接"}
            </div>
          ) : null}
          {!isFetching && !error && branches.length === 0 ? (
            <div className="flex flex-col items-center gap-1 py-5 text-muted-foreground text-sm">
              <GitBranch className="size-4 opacity-60" />
              <span>未找到匹配分支</span>
              {value.trim() ? <span className="text-xs">可直接使用输入的分支名</span> : null}
            </div>
          ) : null}
          {!isFetching && !error
            ? branches.map((branch, index) => (
                <Button
                  key={branch}
                  type="button"
                  role="option"
                  aria-selected={branch === value}
                  variant="ghost"
                  className={cn(
                    "h-9 w-full justify-start gap-2 px-3 font-normal hover:bg-hover",
                    index === activeIndex && "bg-hover",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectBranch(branch)}
                >
                  <GitBranch className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-left">{branch}</span>
                  {branch === defaultBranch ? (
                    <Badge variant="neutral" size="sm">
                      默认
                    </Badge>
                  ) : null}
                </Button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
