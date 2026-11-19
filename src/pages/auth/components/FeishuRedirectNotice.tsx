import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const feishuDeveloperConsoleUrl = "https://open.feishu.cn/app";

// 写成一个字符串，避免 JSX 换行在中文句子之间插入空格。
const explanation =
  "如果飞书页面提示“重定向 URL 有误”（错误码 20029），说明当前域名还没有加入飞书应用的重定向白名单。" +
  "请管理员到飞书开发者后台，在应用的「开发配置 → 安全设置 → 重定向 URL」里添加下面的地址，保存后重新登录。";

type FeishuRedirectNoticeProps = {
  /** 本次登录传给飞书的回调地址，需要加入飞书应用的重定向 URL 白名单。 */
  callbackUrl: string;
  onDismiss: () => void;
};

/**
 * 上一次登录发起后没有回到回调页，最常见的原因是当前域名不在飞书应用的重定向 URL 白名单里
 * （飞书页面提示「重定向 URL 有误」，错误码 20029）。前端读不到飞书的错误页，只能据此提示并给出要添加的地址。
 */
export function FeishuRedirectNotice({ callbackUrl, onDismiss }: FeishuRedirectNoticeProps) {
  const [copied, setCopied] = useState(false);

  return (
    <Alert variant="warning" className="mt-4 text-xs">
      <div className="font-medium">上次登录没有完成？</div>
      <p className="m-0 mt-1 leading-relaxed">{explanation}</p>
      <div className="mt-2 flex items-center gap-1 rounded-md bg-card px-2 py-1.5">
        <code className="min-w-0 flex-1 break-all font-mono text-foreground">{callbackUrl}</code>
        <Button
          aria-label="复制回调地址"
          className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => {
            void navigator.clipboard?.writeText(callbackUrl).then(() => {
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            });
          }}
          size="icon"
          type="button"
          variant="ghost"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <a
          className="inline-flex items-center gap-1 text-primary hover:underline"
          href={feishuDeveloperConsoleUrl}
          rel="noreferrer"
          target="_blank"
        >
          打开飞书开发者后台
          <ExternalLink className="size-3" />
        </a>
        <Button className="h-auto p-0 text-xs" onClick={onDismiss} type="button" variant="link">
          知道了
        </Button>
      </div>
    </Alert>
  );
}
