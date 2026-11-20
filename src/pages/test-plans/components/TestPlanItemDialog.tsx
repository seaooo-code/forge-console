import { skipToken, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { buildsAllQueryKey, fetchAllBuildsSnapshot } from "@/api/builds";
import { fetchAllModulesSnapshot, modulesAllQueryKey } from "@/api/modules";
import { BranchPicker } from "@/components/common/BranchPicker";
import { Field } from "@/components/common/Field";
import { Modal, ModalFooter, ModalHeader } from "@/components/common/Modal";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { TestPlanItemRecord } from "../api";
import { testPlanItemModeLabels } from "../constants";
import type { TestPlanItemFormState } from "../types";
import { shortSha } from "../utils";

type TestPlanItemDialogProps = {
  applicationId: string;
  environment: string;
  error: string;
  /** 编辑已有条目时传入；新增时为空。 */
  item: TestPlanItemRecord | null;
  isOpen: boolean;
  isPending: boolean;
  onClose: () => void;
  onSubmit: (form: TestPlanItemFormState) => void;
  usedModuleIds: string[];
};

/** 新增或修改条目：一个模块绑定一个分支，默认跟随该分支的最新成功构建，也可以固定某一次构建。 */
export function TestPlanItemDialog({
  applicationId,
  environment,
  error,
  item,
  isOpen,
  isPending,
  onClose,
  onSubmit,
  usedModuleIds,
}: TestPlanItemDialogProps) {
  const defaults: TestPlanItemFormState = {
    branch: item?.branch ?? "",
    buildRecordId: item?.mode === "pinned" ? item.buildRecordId : "",
    mode: item?.mode ?? "follow",
    moduleId: item?.moduleId ?? "",
  };
  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setValue,
  } = useForm<TestPlanItemFormState>({ defaultValues: defaults });
  const [moduleId, branch, mode] = useWatch({ control, name: ["moduleId", "branch", "mode"] });

  // biome-ignore lint/correctness/useExhaustiveDependencies: 只在打开或切换条目时重置表单
  useEffect(() => {
    if (isOpen) {
      reset(defaults);
    }
  }, [isOpen, item, reset]);

  const { data: moduleSnapshot } = useQuery({
    queryFn: isOpen && applicationId ? () => fetchAllModulesSnapshot({ applicationId }) : skipToken,
    queryKey: modulesAllQueryKey({ applicationId }),
  });
  const modules = useMemo(
    () =>
      (moduleSnapshot?.modules ?? []).filter(
        (module) => module.id === item?.moduleId || !usedModuleIds.includes(module.id),
      ),
    [item?.moduleId, moduleSnapshot, usedModuleIds],
  );
  const selectedModule = modules.find((module) => module.id === moduleId);

  const buildFilters = { environment, moduleId, status: "succeeded" as const };
  const { data: buildSnapshot, isFetching: isFetchingBuilds } = useQuery({
    queryFn: isOpen && moduleId ? () => fetchAllBuildsSnapshot(buildFilters) : skipToken,
    queryKey: buildsAllQueryKey(buildFilters),
  });
  const branchBuilds = useMemo(
    () =>
      (buildSnapshot?.builds ?? [])
        .filter((build) => build.branch === branch.trim())
        .sort((a, b) => b.number - a.number),
    [branch, buildSnapshot],
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={isPending ? undefined : onClose}
      labelledBy="test-plan-item-title"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader
          title={item ? "修改条目" : "添加条目"}
          titleId="test-plan-item-title"
          description="同一模块的同一分支只能属于一张进行中的提测单。"
        />
        <div className="mt-5 flex flex-col gap-4">
          <Field label="模块" required error={errors.moduleId?.message}>
            <Controller
              control={control}
              name="moduleId"
              rules={{ required: "请选择模块" }}
              render={({ field }) => (
                <Select
                  value={field.value}
                  disabled={Boolean(item)}
                  onValueChange={(value) => {
                    field.onChange(value);
                    setValue("branch", "");
                    setValue("buildRecordId", "");
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="选择模块" />
                  </SelectTrigger>
                  <SelectContent>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name} · {module.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="分支" required error={errors.branch?.message}>
            <Controller
              control={control}
              name="branch"
              rules={{ validate: (value) => (value.trim() ? true : "请填写分支") }}
              render={({ field }) => (
                <BranchPicker
                  defaultBranch={selectedModule?.defaultBranch}
                  invalid={Boolean(errors.branch)}
                  moduleId={moduleId}
                  onBlur={field.onBlur}
                  onChange={(value) => {
                    field.onChange(value);
                    setValue("buildRecordId", "");
                  }}
                  value={field.value}
                />
              )}
            />
          </Field>
          <Field
            label="构建"
            hint={
              mode === "follow"
                ? "该分支在这个环境下有新的成功构建时，条目自动换成新构建。"
                : "构建固定不变，用于回归或复测某一次构建。"
            }
          >
            <Controller
              control={control}
              name="mode"
              render={({ field }) => (
                <Tabs value={field.value} onValueChange={(value) => field.onChange(value)}>
                  <TabsList>
                    <TabsTrigger value="follow">{testPlanItemModeLabels.follow}</TabsTrigger>
                    <TabsTrigger value="pinned">{testPlanItemModeLabels.pinned}</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />
          </Field>
          {mode === "pinned" ? (
            <Field label="固定的构建" required error={errors.buildRecordId?.message}>
              <Controller
                control={control}
                name="buildRecordId"
                rules={{ validate: (value) => (mode !== "pinned" || value ? true : "请选择构建") }}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!branch.trim()}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          !branch.trim()
                            ? "先选择分支"
                            : isFetchingBuilds
                              ? "加载构建中"
                              : branchBuilds.length === 0
                                ? "该分支在这个环境下没有成功的构建"
                                : "选择构建"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {branchBuilds.map((build) => (
                        <SelectItem key={build.id} value={build.id}>
                          #{build.number} · {shortSha(build.commitSha)} · {build.runtimeVersion} ·{" "}
                          {build.createdAt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          ) : null}
          {error ? <Alert variant="danger">{error}</Alert> : null}
        </div>
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
            取消
          </Button>
          <Button type="submit" loading={isPending}>
            保存
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
