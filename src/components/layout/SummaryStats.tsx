import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SummaryStatTone = "default" | "info" | "success" | "warning" | "destructive";

export type SummaryStat = {
  id: string;
  label: string;
  value: number | string;
  tone?: SummaryStatTone;
};

const toneDot: Record<SummaryStatTone, string> = {
  default: "",
  destructive: "bg-destructive",
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
};

type SummaryStatsProps = {
  items: SummaryStat[];
  /** 当前作为筛选条件生效的那一项；传了 onSelect 才会渲染成可点击。 */
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
};

/** 标题下的一行摘要：数字加标签，点击可直接按这一项筛选。替代列表页顶部的指标卡片行。 */
export function SummaryStats({ items, activeId, onSelect, className }: SummaryStatsProps) {
  return (
    <div className={cn("-ml-2 flex flex-wrap items-center gap-0.5 text-sm", className)}>
      {items.map((item) => {
        const tone = item.tone ?? "default";
        const content = (
          <>
            {tone !== "default" ? (
              <i className={cn("size-1.5 rounded-full", toneDot[tone])} />
            ) : null}
            <span className="font-semibold text-foreground tabular-nums">{item.value}</span>
            <span className="text-muted-foreground">{item.label}</span>
          </>
        );

        if (!onSelect) {
          return (
            <span key={item.id} className="inline-flex h-7 items-center gap-1.5 px-2">
              {content}
            </span>
          );
        }

        const active = activeId === item.id;
        return (
          <Button
            key={item.id}
            type="button"
            variant="ghost"
            aria-pressed={active}
            onClick={() => onSelect(item.id)}
            className={cn(
              "h-7 gap-1.5 rounded-lg px-2 font-normal",
              active && "bg-background shadow-edge hover:bg-background",
            )}
          >
            {content}
          </Button>
        );
      })}
    </div>
  );
}
