import type { ReactNode } from "react";
import type { Control, UseFormRegisterReturn } from "react-hook-form";
import { Controller } from "react-hook-form";
import { searchFeishuUsers } from "@/api/feishu-user-search";
import { OwnerPicker } from "@/components/common/OwnerPicker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FeishuUserSearchResult } from "@/types/feishu";
import { codeSourceProviderLabels, kindOptions } from "../constants";
import type {
  CodeSourceConnection,
  ModuleFormState,
  ModuleKind,
  ModuleRecord,
  ModuleRepositorySelection,
} from "../types";
import { CodeSourceProviderIcon } from "./CodeSourceProviderIcon";
import { RepositoryPicker } from "./RepositoryPicker";

type ModuleFormFieldsProps = {
  applicationOptions: Array<{ label: string; value: string }>;
  clearFormError: () => void;
  commonModuleOptions: ModuleRecord[];
  connections: CodeSourceConnection[];
  control: Control<ModuleFormState>;
  isEditMode: boolean;
  moduleIdField: UseFormRegisterReturn;
  moduleNameField: UseFormRegisterReturn;
  onApplicationChange: (value: string) => void;
  onConnectionChange: (value: string) => void;
  onKindChange: (value: ModuleKind) => void;
  onOwnerChange: (value: string) => void;
  onOwnerSelect: (user: FeishuUserSearchResult) => void;
  onRepositoryChange: (repository: ModuleRepositorySelection | null) => void;
  selectedConnection: CodeSourceConnection | undefined;
  selectedKind: ModuleKind;
};

export function ModuleFormFields({
  applicationOptions,
  clearFormError,
  commonModuleOptions,
  connections,
  control,
  isEditMode,
  moduleIdField,
  moduleNameField,
  onApplicationChange,
  onConnectionChange,
  onKindChange,
  onOwnerChange,
  onOwnerSelect,
  onRepositoryChange,
  selectedConnection,
  selectedKind,
}: ModuleFormFieldsProps) {
  return (
    <div className="space-y-5 p-4">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-primary" />
          <h2 className="font-semibold text-foreground text-sm">基础信息</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
          <Field label="模块 ID" className="xl:col-span-4">
            <Input
              readOnly={isEditMode}
              aria-disabled={isEditMode}
              className={isEditMode ? "cursor-not-allowed bg-muted text-muted-foreground" : ""}
              placeholder="例如：module-profile"
              {...moduleIdField}
              onChange={(event) => {
                moduleIdField.onChange(event);
                clearFormError();
              }}
            />
          </Field>
          <Field label="模块名称" className="xl:col-span-4">
            <Input
              placeholder="例如：profile"
              {...moduleNameField}
              onChange={(event) => {
                moduleNameField.onChange(event);
                clearFormError();
              }}
            />
          </Field>
          <Field label="关联应用" className="xl:col-span-4">
            <Controller
              control={control}
              name="applicationId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={onApplicationChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择应用" />
                  </SelectTrigger>
                  <SelectContent>
                    {applicationOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="负责人" className="xl:col-span-4">
            <Controller
              control={control}
              name="owner"
              render={({ field }) => (
                <OwnerPicker
                  inputName={field.name}
                  inputRef={field.ref}
                  value={field.value}
                  searchUsers={searchFeishuUsers}
                  onBlur={field.onBlur}
                  onChange={onOwnerChange}
                  onSelect={onOwnerSelect}
                />
              )}
            />
          </Field>
          <Field label="模块类型" className="xl:col-span-4">
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => onKindChange(value as ModuleKind)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {kindOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          {selectedKind === "Feature" ? (
            <Field label="通用模块" className="xl:col-span-4">
              <Controller
                control={control}
                name="commonModuleId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      clearFormError();
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择关联应用的通用模块" />
                    </SelectTrigger>
                    <SelectContent emptyText="暂无通用模块">
                      {commonModuleOptions.map((module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {commonModuleOptions.length === 0 ? (
                <p className="mt-2 text-warning text-xs">请先为当前应用创建通用模块</p>
              ) : null}
            </Field>
          ) : null}
        </div>
      </section>

      <section className="pt-6">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-4 w-1 rounded-full bg-success" />
          <h2 className="font-semibold text-foreground text-sm">仓库信息</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-12">
          <Field label="代码源连接" className="xl:col-span-4">
            <Controller
              control={control}
              name="connectionId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={onConnectionChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择代码源连接" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((connection) => (
                      <SelectItem
                        key={connection.id}
                        value={connection.id}
                        disabled={connection.status !== "active"}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <CodeSourceProviderIcon provider={connection.provider} />
                          <span className="truncate">{connection.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {connection.status === "active"
                              ? codeSourceProviderLabels[connection.provider]
                              : "已停用"}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedConnection ? (
              <p className="mt-2 truncate text-muted-foreground text-xs">
                {selectedConnection.webBaseUrl}
                {selectedConnection.externalAccount
                  ? ` · ${selectedConnection.externalAccount}`
                  : ""}
              </p>
            ) : null}
          </Field>
          <Field label="Git 仓库" className="xl:col-span-8">
            <Controller
              control={control}
              name="repository"
              render={({ field }) => (
                <RepositoryPicker
                  connection={selectedConnection}
                  value={field.value}
                  onChange={onRepositoryChange}
                />
              )}
            />
          </Field>
        </div>
      </section>
    </div>
  );
}

function Field({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div className={className}>
      <div className="mb-2 font-medium text-muted-foreground text-xs">{label}</div>
      {children}
    </div>
  );
}
