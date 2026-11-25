import { KeyRound, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { type Control, useFieldArray } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { buildVariableSecretMask } from "../constants";
import type { ModuleFormState } from "../types";
import { BuildVariableDialog } from "./BuildVariableDialog";

const gridColumns = "md:grid-cols-[minmax(160px,1fr)_130px_minmax(160px,1.4fr)_80px_64px]";

/**
 * 新建模块时一起填写的构建变量，随创建请求提交，后端与模块在同一个事务里写入。
 * 这里只支持新增和删除；创建后在模块详情的「构建变量」页签里编辑。
 */
export function ModuleCreateBuildVariablesField({
  clearFormError,
  control,
  environmentOptions,
}: {
  clearFormError: () => void;
  control: Control<ModuleFormState>;
  environmentOptions: Array<{ label: string; value: string }>;
}) {
  const { append, fields, remove } = useFieldArray({ control, name: "buildVariables" });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const environmentLabels = new Map(
    environmentOptions.map((option) => [option.value, option.label]),
  );

  return (
    <section className="pt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-info" />
          <h2 className="font-semibold text-foreground text-sm">构建变量</h2>
          <span className="text-muted-foreground text-xs">
            可选，和模块一起创建；创建后在模块详情的「构建变量」页签修改
          </span>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            clearFormError();
            setIsDialogOpen(true);
          }}
        >
          <Plus className="size-3.5" />
          新增变量
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-4 text-muted-foreground text-xs">
          <KeyRound className="size-4" />
          没有构建变量。gitlab_ci、适配器构建需要的参数（例如
          YRN_KIND）可以在这里一起填好，避免首次构建缺参数。
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <div className={`hidden px-4 py-2 font-medium text-faint text-xs md:grid ${gridColumns}`}>
            <span>Key</span>
            <span>作用环境</span>
            <span>值</span>
            <span>密钥</span>
            <span>操作</span>
          </div>
          {fields.map((field, index) => (
            <div
              key={field.id}
              className={`grid gap-2 border-t px-4 py-2.5 text-sm md:items-center ${gridColumns}`}
            >
              <span className="break-all font-mono font-semibold text-foreground text-xs">
                {field.key}
              </span>
              <span>
                {field.environmentCode ? (
                  <Badge variant="info">
                    {environmentLabels.get(field.environmentCode) ?? field.environmentCode}
                  </Badge>
                ) : (
                  <Badge variant="neutral">全部环境</Badge>
                )}
              </span>
              <span className="line-clamp-2 break-all font-mono text-muted-foreground text-xs">
                {field.isSecret ? buildVariableSecretMask : field.value || "（空）"}
              </span>
              <span>
                {field.isSecret ? (
                  <Badge variant="warning">是</Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">否</span>
                )}
              </span>
              <Button
                variant="link"
                type="button"
                aria-label={`删除构建变量 ${field.key}`}
                className="h-auto justify-start gap-1 p-0 text-destructive text-xs hover:text-destructive/80"
                onClick={() => {
                  clearFormError();
                  remove(index);
                }}
              >
                <Trash2 className="size-3.5" />
                删除
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* 弹窗自带 <form>，这个组件又在新建模块的 <form> 里；渲染到 body 下，避免表单嵌套导致保存时提交了整个页面。 */}
      {createPortal(
        <BuildVariableDialog
          environmentOptions={environmentOptions}
          existingVariables={fields}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={async (form) => {
            if (form) {
              append(form);
            }
            setIsDialogOpen(false);
          }}
          submitError=""
          variable={null}
        />,
        document.body,
      )}
    </section>
  );
}
