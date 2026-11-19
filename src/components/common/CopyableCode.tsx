import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyableCodeProps = {
  /** 展示并复制的文本，例如回调地址。 */
  value: string;
  /** 复制按钮的无障碍名称，例如“回调地址”，会拼成“复制回调地址”。 */
  label: string;
  className?: string;
};

/** 等宽展示一段文本，右侧带复制按钮，复制成功后图标短暂变为对勾。 */
export function CopyableCode({ value, label, className }: CopyableCodeProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <div className={cn("flex items-center gap-1 rounded-md bg-card px-2 py-1.5", className)}>
      <code className="min-w-0 flex-1 break-all font-mono text-foreground">{value}</code>
      <Button
        aria-label={`复制${label}`}
        className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => {
          void navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setCopied(false), 1500);
          });
        }}
        size="icon"
        type="button"
        variant="ghost"
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}
