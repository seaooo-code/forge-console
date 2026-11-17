import { Crosshair } from "lucide-react";
import { useRef } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { BuildAdapterTemplateError } from "../types";
import { formatTemplateLocation } from "../utils";

type TemplateEditorProps = {
  error?: BuildAdapterTemplateError | null;
  field: UseFormRegisterReturn;
  minRows?: number;
  placeholder?: string;
  readOnly?: boolean;
  value: string;
};

/**
 * 等宽多行模板编辑：左侧行号随内容增长（不在编辑框内滚动，行号天然对齐），
 * 出错行在行号上标红，并可一键定位到该行。
 */
export function TemplateEditor({
  error,
  field,
  minRows = 6,
  placeholder,
  readOnly = false,
  value,
}: TemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lineCount = Math.max(minRows, (value ?? "").split("\n").length);
  const errorLine = error?.line ?? 0;

  const focusLine = (line: number) => {
    const textarea = textareaRef.current;
    if (!textarea || line < 1) {
      return;
    }
    const lines = textarea.value.split("\n");
    const start = lines.slice(0, line - 1).reduce((total, item) => total + item.length + 1, 0);
    const end = start + (lines[line - 1]?.length ?? 0);
    textarea.focus();
    textarea.setSelectionRange(start, end);
    textarea.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex overflow-hidden rounded-md border border-input bg-card",
          error && "border-destructive/60",
        )}
      >
        <div
          aria-hidden="true"
          className="shrink-0 select-none bg-surface-2 px-2 py-2 text-right font-mono text-muted-foreground text-xs leading-5"
        >
          {Array.from({ length: lineCount }, (_, index) => {
            const line = index + 1;
            return (
              <div
                key={line}
                className={cn(
                  line === errorLine && "rounded-sm bg-destructive/15 text-destructive",
                )}
              >
                {line}
              </div>
            );
          })}
        </div>
        <Textarea
          {...field}
          ref={(element) => {
            field.ref(element);
            textareaRef.current = element;
          }}
          readOnly={readOnly}
          rows={lineCount}
          wrap="off"
          spellCheck={false}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          className="field-sizing-fixed min-h-0 resize-none overflow-x-auto overflow-y-hidden rounded-none border-0 font-mono text-xs leading-5 shadow-none focus-visible:ring-0 md:text-xs"
        />
      </div>
      {error ? (
        <Alert variant="danger" className="items-center">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 break-all">
              <span className="font-semibold">
                {error.source === "save" ? "保存失败" : "预览错误"}：{formatTemplateLocation(error)}
              </span>
              <span className="ml-2">{error.message}</span>
            </span>
            {error.line > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7"
                onClick={() => focusLine(error.line)}
              >
                <Crosshair className="size-3.5" />
                定位到第 {error.line} 行
              </Button>
            ) : null}
          </div>
        </Alert>
      ) : null}
    </div>
  );
}
