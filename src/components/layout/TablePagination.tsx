import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

type TablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: ReadonlyArray<number>;
  className?: string;
};

/**
 * List-page footer with range info, jump-to-page input, and page-size selector.
 * Replaces `ConsoleTableFooter` for new pages; the old component stays
 * available for callers that haven't migrated.
 */
export function TablePagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  className,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, total);

  // Compact window: 1 … (page-1) (page) (page+1) … last
  const pagesAround = (() => {
    const items: Array<number | "ellipsis"> = [];
    const range = 1;
    for (let p = 1; p <= totalPages; p += 1) {
      if (p === 1 || p === totalPages || (p >= safePage - range && p <= safePage + range)) {
        items.push(p);
      } else if (items[items.length - 1] !== "ellipsis") {
        items.push("ellipsis");
      }
    }
    return items;
  })();

  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3 text-muted-foreground text-sm md:flex-row md:items-center md:justify-between",
        className,
      )}
    >
      <span>
        共 <span className="font-semibold text-foreground">{total}</span> 条 · 当前第{" "}
        <span className="font-semibold text-foreground">
          {start}–{end}
        </span>{" "}
        条
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          type="button"
          className="size-8"
          disabled={safePage <= 1}
          aria-label="上一页"
          onClick={() => onPageChange(safePage - 1)}
        >
          <ChevronLeft className="size-4" />
        </Button>

        {pagesAround.map((p, i) =>
          p === "ellipsis" ? (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: static ellipsis between page buttons
              key={`e-${i}`}
              className="px-1 text-muted-foreground/60"
            >
              …
            </span>
          ) : (
            <Button
              key={p}
              variant={p === safePage ? "default" : "outline"}
              size="icon"
              type="button"
              className={cn(
                "size-8 text-xs",
                p === safePage && "bg-primary text-primary-foreground",
              )}
              aria-current={p === safePage ? "page" : undefined}
              onClick={() => onPageChange(p)}
            >
              {p}
            </Button>
          ),
        )}

        <Button
          variant="outline"
          size="icon"
          type="button"
          className="size-8"
          disabled={safePage >= totalPages}
          aria-label="下一页"
          onClick={() => onPageChange(safePage + 1)}
        >
          <ChevronRight className="size-4" />
        </Button>

        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          <SelectTrigger className="h-8 w-28 bg-card px-3 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} 条/页
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
