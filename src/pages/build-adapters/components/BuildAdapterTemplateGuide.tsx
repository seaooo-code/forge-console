import { BookOpen, KeyRound } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";

import { buildAdapterTemplateFields, buildAdapterTemplateFunctions } from "../constants";

/** 模板变量说明，内容对应后端渲染器的上下文与函数白名单。 */
export function BuildAdapterTemplateGuide() {
  return (
    <Card className="gap-0 rounded-lg p-0">
      <div className="flex items-center gap-2 px-4 py-3">
        <BookOpen className="size-4 text-muted-foreground" />
        <h2 className="font-semibold text-foreground text-sm">模板变量说明</h2>
      </div>
      <div className="space-y-4 px-4 py-3 text-xs">
        <p className="text-muted-foreground leading-5">
          Dockerfile 模板和辅助文件都使用 Go text/template 语法，例如{" "}
          <code className="font-mono text-foreground">{"{{ .Module.Name }}"}</code>
          。引用不存在的字段会直接报错。
        </p>

        <dl className="space-y-1.5">
          {buildAdapterTemplateFields.map((field) => (
            <div key={field.name} className="grid grid-cols-5 gap-2">
              <dt className="col-span-2 break-all font-mono text-foreground">{field.name}</dt>
              <dd className="col-span-3 text-muted-foreground">{field.description}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-1.5">
          <div className="font-medium text-foreground">可用函数</div>
          {buildAdapterTemplateFunctions.map((item) => (
            <div key={item.usage} className="space-y-0.5">
              <code className="block break-all font-mono text-foreground">{item.usage}</code>
              <div className="text-muted-foreground">{item.description}</div>
            </div>
          ))}
          <p className="text-muted-foreground leading-5">
            不支持 define、template、block；range 只能遍历上下文字段或变量，最多嵌套 3 层。
          </p>
        </div>

        <Alert variant="warning" icon={false} className="text-xs">
          <span className="inline-flex items-start gap-1.5">
            <KeyRound className="mt-1 size-3.5 shrink-0" />
            <span>
              构建变量和密钥不进入模板，请在 Dockerfile 里用 <code className="font-mono">ARG</code>{" "}
              和 <code className="font-mono">--mount=type=secret</code> 读取。平台注入的 FORGE_*
              build-arg 保持不变。
            </span>
          </span>
        </Alert>
      </div>
    </Card>
  );
}
