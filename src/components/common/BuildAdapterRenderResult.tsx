import { Check, Copy, FileCode2 } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { BuildAdapterRenderPreview } from "@/types/build-adapters";

type BuildAdapterRenderResultProps = {
  result: BuildAdapterRenderPreview;
};

/**
 * 构建适配器渲染预览结果：渲染后的 Dockerfile、辅助文件和 sha256，或带模板与行号的错误。
 * 适配器编辑页和模块构建配置都会展示同一份结果，所以放在 common。
 */
export function BuildAdapterRenderResult({ result }: BuildAdapterRenderResultProps) {
  if (!result.ok) {
    const error = result.error;
    const location = error?.template
      ? error.line > 0
        ? `${error.template} 第 ${error.line} 行`
        : error.template
      : "";

    return (
      <Alert variant="danger">
        <div className="font-semibold">渲染失败{location ? `：${location}` : ""}</div>
        <div className="mt-1 whitespace-pre-wrap break-all">{error?.message || "未知错误"}</div>
      </Alert>
    );
  }

  const filePaths = Object.keys(result.files).sort();

  return (
    <div className="space-y-3">
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">Dockerfile sha256</span>
        <code
          className="min-w-0 break-all font-mono text-foreground"
          title={result.dockerfileSha256}
        >
          {result.dockerfileSha256}
        </code>
        <CopyButton label="复制 sha256" value={result.dockerfileSha256} />
      </div>

      <RenderedBlock title="Dockerfile" content={result.dockerfile} />

      <div className="space-y-2">
        <div className="flex items-center gap-2 font-medium text-muted-foreground text-xs">
          辅助文件
          <Badge variant="neutral" size="sm">
            {filePaths.length}
          </Badge>
        </div>
        {filePaths.length === 0 ? (
          <p className="text-muted-foreground text-xs">没有辅助文件</p>
        ) : (
          filePaths.map((path) => (
            <RenderedBlock key={path} title={`.forge/${path}`} content={result.files[path]} />
          ))
        )}
      </div>
    </div>
  );
}

function RenderedBlock({ content, title }: { content: string; title: string }) {
  return (
    <div className="overflow-hidden rounded-lg bg-card shadow-edge">
      <div className="flex items-center justify-between gap-2 bg-surface-2 px-3 py-1.5">
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-foreground text-xs">
          <FileCode2 className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{title}</span>
        </span>
        <CopyButton label={`复制 ${title}`} value={content} />
      </div>
      <pre className="max-h-96 overflow-auto bg-card px-3 py-2 font-mono text-foreground text-xs leading-5">
        {content || " "}
      </pre>
    </div>
  );
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        });
      }}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </Button>
  );
}
