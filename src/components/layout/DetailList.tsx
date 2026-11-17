import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DetailListItem = {
  label: string;
  value: ReactNode;
  /** 值下面的一行补充说明。 */
  hint?: ReactNode;
  /** 占满整行，用于地址、哈希这类长值。 */
  wide?: boolean;
  mono?: boolean;
};

type DetailListProps = {
  items: (DetailListItem | false | null | undefined)[];
  columns?: 1 | 2 | 3;
  className?: string;
};

const columnClass = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
};

/** 详情页的键值对。不画边框和底色，靠留白和标签字号区分，放在白卡或面板里使用。 */
export function DetailList({ items, columns = 2, className }: DetailListProps) {
  return (
    <dl className={cn("m-0 grid gap-x-6 gap-y-4", columnClass[columns], className)}>
      {items.filter(Boolean).map((item) => {
        const entry = item as DetailListItem;
        return (
          <div key={entry.label} className={cn("min-w-0", entry.wide && "sm:col-span-full")}>
            <dt className="text-faint text-xs">{entry.label}</dt>
            <dd
              className={cn(
                "m-0 mt-1 break-words text-foreground text-sm",
                entry.mono && "break-all font-mono text-xs",
              )}
            >
              {entry.value === "" || entry.value === null || entry.value === undefined
                ? "-"
                : entry.value}
            </dd>
            {entry.hint ? <dd className="m-0 mt-0.5 text-faint text-xs">{entry.hint}</dd> : null}
          </div>
        );
      })}
    </dl>
  );
}
