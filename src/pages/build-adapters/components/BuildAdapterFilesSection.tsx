import { FilePlus2, FolderOpen, Trash2 } from "lucide-react";
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
  useWatch,
} from "react-hook-form";

import { FormSectionHeader } from "@/components/common/FormSectionHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { buildAdapterFilesDir, maxBuildAdapterFiles } from "../constants";
import type { BuildAdapterFormState, BuildAdapterTemplateError } from "../types";
import { validateBuildAdapterFilePath } from "../utils";
import { TemplateEditor } from "./TemplateEditor";

type BuildAdapterFilesSectionProps = {
  control: Control<BuildAdapterFormState>;
  errors: FieldErrors<BuildAdapterFormState>["files"];
  readOnly: boolean;
  register: UseFormRegister<BuildAdapterFormState>;
  templateError: BuildAdapterTemplateError | null;
};

export function BuildAdapterFilesSection({
  control,
  errors,
  readOnly,
  register,
  templateError,
}: BuildAdapterFilesSectionProps) {
  const { append, fields, remove } = useFieldArray({ control, name: "files" });
  const files = useWatch({ control, name: "files" }) ?? [];

  return (
    <Card className="gap-0 rounded-lg p-0">
      <FormSectionHeader
        title="辅助文件"
        description={`文件会放到构建上下文的 ${buildAdapterFilesDir}/ 下，内容同样按模板渲染；仓库里已有 ${buildAdapterFilesDir}/ 目录时构建会失败。最多 ${maxBuildAdapterFiles} 个。`}
      />
      <div className="space-y-4 px-5 py-4">
        {fields.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-4 text-muted-foreground text-sm">
            <FolderOpen className="size-4" />
            暂无辅助文件
          </div>
        ) : null}

        {fields.map((item, index) => {
          const path = files[index]?.path?.trim() ?? "";
          const pathError = errors?.[index]?.path?.message;
          const pathField = register(`files.${index}.path`, {
            validate: (value, formValues) => {
              const result = validateBuildAdapterFilePath(value);
              if (result !== true) {
                return result;
              }
              const trimmed = value.trim();
              const others = formValues.files
                .filter((_, otherIndex) => otherIndex !== index)
                .map((file) => file.path.trim());
              if (others.includes(trimmed)) {
                return "路径与其他文件重复";
              }
              const conflict = others.find(
                (other) => other.startsWith(`${trimmed}/`) || trimmed.startsWith(`${other}/`),
              );
              return conflict ? `路径与 ${conflict} 互为父子目录` : true;
            },
          });

          return (
            <div key={item.id} className="space-y-2 rounded-md shadow-edge p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center rounded-md border border-input focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                    <span className="shrink-0 bg-surface-2 px-2.5 py-2 font-mono text-muted-foreground text-xs leading-5">
                      {buildAdapterFilesDir}/
                    </span>
                    <Input
                      {...pathField}
                      readOnly={readOnly}
                      placeholder="例如：build.sh 或 config/app.json"
                      aria-invalid={pathError ? true : undefined}
                      className="rounded-none border-0 font-mono shadow-none focus-visible:ring-0"
                    />
                  </div>
                  {pathError ? <p className="mt-1 text-destructive text-xs">{pathError}</p> : null}
                </div>
                {readOnly ? null : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="删除辅助文件"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
              <TemplateEditor
                error={
                  templateError && path && templateError.template === path ? templateError : null
                }
                field={register(`files.${index}.content`)}
                minRows={4}
                readOnly={readOnly}
                value={files[index]?.content ?? ""}
              />
            </div>
          );
        })}

        {readOnly ? null : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fields.length >= maxBuildAdapterFiles}
            onClick={() => append({ content: "", path: "" })}
          >
            <FilePlus2 className="size-3.5" />
            添加文件
          </Button>
        )}
      </div>
    </Card>
  );
}
