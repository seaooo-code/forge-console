import { type Control, Controller, type UseFormRegister } from "react-hook-form";

import { type AssignableUser, searchAssignableUsers } from "@/api/feishu-user-search";
import { FormSectionField, FormSectionHeader } from "@/components/common/FormSectionHeader";
import { OwnerPicker } from "@/components/common/OwnerPicker";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StorageAdapter, StorageStatus } from "@/types/storage";

import { storageAdapterOptions } from "../constants";
import type { StorageFormState } from "../types";

type StorageBasicInfoSectionProps = {
  control: Control<StorageFormState>;
  onOwnerChange: (value: string) => void;
  onOwnerSelect: (user: AssignableUser) => void;
  register: UseFormRegister<StorageFormState>;
};

export function StorageBasicInfoSection({
  control,
  onOwnerChange,
  onOwnerSelect,
  register,
}: StorageBasicInfoSectionProps) {
  return (
    <Card className="rounded-lg bg-card p-0">
      <FormSectionHeader title="基础信息" description="命名配置并选择对象存储适配器" />
      <div className="grid gap-4 px-5 pb-5 sm:grid-cols-2">
        <FormSectionField label="配置名称" required>
          <Input placeholder="例如：小米汽车-生产OSS" {...register("name")} />
        </FormSectionField>
        <FormSectionField label="适配器" required>
          <Controller
            control={control}
            name="adapter"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value as StorageAdapter)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {storageAdapterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormSectionField>
        <FormSectionField label="状态">
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(value) => field.onChange(value as StorageStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">正常</SelectItem>
                  <SelectItem value="error">异常</SelectItem>
                  <SelectItem value="disabled">已停用</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormSectionField>
        <FormSectionField label="负责人" required>
          <Controller
            control={control}
            name="owner"
            render={({ field }) => (
              <OwnerPicker
                inputName={field.name}
                inputRef={field.ref}
                value={field.value}
                searchUsers={searchAssignableUsers}
                onBlur={field.onBlur}
                onChange={onOwnerChange}
                onSelect={onOwnerSelect}
              />
            )}
          />
        </FormSectionField>
      </div>
    </Card>
  );
}
