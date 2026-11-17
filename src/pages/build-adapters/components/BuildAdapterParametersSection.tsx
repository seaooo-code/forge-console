import { ListPlus, SlidersHorizontal, Trash2 } from "lucide-react";
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormRegister,
  useFieldArray,
} from "react-hook-form";

import { FormSectionHeader } from "@/components/common/FormSectionHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { hasControlCharacter } from "@/utils";

import { emptyBuildAdapterParameter, maxBuildAdapterParameters } from "../constants";
import type { BuildAdapterFormState } from "../types";
import { validateBuildAdapterParameterKey } from "../utils";

type BuildAdapterParametersSectionProps = {
  control: Control<BuildAdapterFormState>;
  errors: FieldErrors<BuildAdapterFormState>["parameters"];
  readOnly: boolean;
  register: UseFormRegister<BuildAdapterFormState>;
};

export function BuildAdapterParametersSection({
  control,
  errors,
  readOnly,
  register,
}: BuildAdapterParametersSectionProps) {
  const { append, fields, remove } = useFieldArray({ control, name: "parameters" });

  return (
    <Card className="gap-0 rounded-lg p-0">
      <FormSectionHeader
        title="参数定义"
        description={`模块选用适配器时按这里的定义填写参数，模板中用 .Params.<key> 引用。参数不能存放密钥，最多 ${maxBuildAdapterParameters} 个。`}
      />
      <div className="space-y-3 px-5 py-4">
        {fields.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-4 text-muted-foreground text-sm">
            <SlidersHorizontal className="size-4" />
            暂无参数
          </div>
        ) : (
          <div className="hidden grid-cols-12 gap-2 px-1 font-medium text-muted-foreground text-xs lg:grid">
            <span className="col-span-2">key</span>
            <span className="col-span-2">显示名称</span>
            <span className="col-span-4">描述</span>
            <span className="col-span-1">必填</span>
            <span className="col-span-2">默认值</span>
          </div>
        )}

        {fields.map((item, index) => {
          const rowErrors = errors?.[index];
          const message = rowErrors?.key?.message ?? rowErrors?.default?.message;

          return (
            <div key={item.id} className="space-y-1">
              <div className="grid grid-cols-1 items-center gap-2 lg:grid-cols-12">
                <Input
                  {...register(`parameters.${index}.key`, {
                    validate: (value, formValues) => {
                      const result = validateBuildAdapterParameterKey(value);
                      if (result !== true) {
                        return result;
                      }
                      const duplicated = formValues.parameters.some(
                        (parameter, otherIndex) =>
                          otherIndex !== index && parameter.key.trim() === value.trim(),
                      );
                      return duplicated ? `key ${value.trim()} 重复` : true;
                    },
                  })}
                  readOnly={readOnly}
                  placeholder="entry"
                  aria-invalid={rowErrors?.key ? true : undefined}
                  className="font-mono lg:col-span-2"
                />
                <Input
                  {...register(`parameters.${index}.label`)}
                  readOnly={readOnly}
                  placeholder="默认同 key"
                  className="lg:col-span-2"
                />
                <Input
                  {...register(`parameters.${index}.description`)}
                  readOnly={readOnly}
                  placeholder="参数说明"
                  className="lg:col-span-4"
                />
                <Controller
                  control={control}
                  name={`parameters.${index}.required`}
                  render={({ field }) => (
                    <div className="flex items-center gap-2 lg:col-span-1">
                      <Checkbox
                        id={`build-adapter-parameter-required-${item.id}`}
                        checked={field.value}
                        disabled={readOnly}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      <label
                        htmlFor={`build-adapter-parameter-required-${item.id}`}
                        className="text-foreground text-sm lg:sr-only"
                      >
                        必填
                      </label>
                    </div>
                  )}
                />
                <div className="flex items-center gap-2 lg:col-span-3">
                  <Input
                    {...register(`parameters.${index}.default`, {
                      validate: (value) =>
                        hasControlCharacter(value) ? "默认值不能包含换行或控制字符" : true,
                    })}
                    readOnly={readOnly}
                    placeholder="可选"
                    aria-invalid={rowErrors?.default ? true : undefined}
                    className="font-mono"
                  />
                  {readOnly ? null : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="删除参数"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
              {message ? <p className="text-destructive text-xs">{message}</p> : null}
            </div>
          );
        })}

        {readOnly ? null : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fields.length >= maxBuildAdapterParameters}
            onClick={() => append({ ...emptyBuildAdapterParameter })}
          >
            <ListPlus className="size-3.5" />
            添加参数
          </Button>
        )}
      </div>
    </Card>
  );
}
