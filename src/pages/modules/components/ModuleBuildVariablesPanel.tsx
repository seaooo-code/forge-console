import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Pencil, Plus, Trash2 } from "lucide-react";
import { type ReactNode, useState } from "react";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import {
  deleteModuleBuildVariable,
  fetchModuleBuildVariables,
  ModuleAPIError,
  moduleBuildVariablesQueryKey,
  upsertModuleBuildVariable,
} from "../api/modules-snapshot";
import { buildVariableSecretMask } from "../constants";
import type { BuildVariableFormState, ModuleBuildVariable } from "../types";
import { formatDateTime } from "../utils";
import { BuildVariableDialog } from "./BuildVariableDialog";

const gridColumns =
  "xl:grid-cols-[minmax(160px,1fr)_130px_minmax(160px,1.2fr)_80px_110px_160px_110px]";

export function ModuleBuildVariablesPanel({
  canManage,
  environmentOptions,
  moduleId,
}: {
  canManage: boolean;
  environmentOptions: Array<{ label: string; value: string }>;
  moduleId: string;
}) {
  const queryClient = useQueryClient();
  const {
    data: variables = [],
    error,
    isFetching,
  } = useQuery({
    queryFn: () => fetchModuleBuildVariables(moduleId),
    queryKey: moduleBuildVariablesQueryKey(moduleId),
    retry: false,
  });
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    variable: ModuleBuildVariable | null;
  }>({ isOpen: false, variable: null });
  const [submitError, setSubmitError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ModuleBuildVariable | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState("");
  const environmentLabels = new Map(
    environmentOptions.map((option) => [option.value, option.label]),
  );
  const isForbidden = error instanceof ModuleAPIError && error.status === 403;

  const closeDialog = () => {
    setDialogState({ isOpen: false, variable: null });
    setSubmitError("");
  };

  const handleSubmit = async (form: BuildVariableFormState | null) => {
    if (!form) {
      closeDialog();
      return;
    }

    setSubmitError("");
    try {
      await upsertModuleBuildVariable(moduleId, form);
      await queryClient.invalidateQueries({ queryKey: moduleBuildVariablesQueryKey(moduleId) });
      closeDialog();
    } catch (submitFailure) {
      setSubmitError(
        submitFailure instanceof Error ? submitFailure.message : "保存构建变量失败，请稍后重试",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setActionError("");
    try {
      await deleteModuleBuildVariable(moduleId, deleteTarget);
      await queryClient.invalidateQueries({ queryKey: moduleBuildVariablesQueryKey(moduleId) });
      setDeleteTarget(null);
    } catch (deleteFailure) {
      setActionError(
        deleteFailure instanceof Error ? deleteFailure.message : "删除构建变量失败，请稍后重试",
      );
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="gap-0 rounded-lg py-0">
      <div className="flex h-14 items-center justify-between gap-3 border-border border-b px-4">
        <div>
          <div className="font-semibold text-foreground text-sm">构建变量</div>
          <div className="text-muted-foreground text-xs">
            构建时注入，环境专属值覆盖全部环境的同名变量；FORGE_ 前缀由平台保留
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!canManage || isForbidden}
          onClick={() => {
            setSubmitError("");
            setDialogState({ isOpen: true, variable: null });
          }}
        >
          <Plus className="size-3.5" />
          新增变量
        </Button>
      </div>

      {actionError ? (
        <div className="px-4 pt-4">
          <Alert variant="danger">{actionError}</Alert>
        </div>
      ) : null}

      {error ? (
        <div className="p-4">
          <Alert variant={isForbidden ? "warning" : "danger"}>
            {isForbidden
              ? "当前账号没有该模块的管理权限（module:update），无法查看构建变量"
              : error instanceof Error
                ? error.message
                : "读取构建变量失败"}
          </Alert>
        </div>
      ) : null}

      {!error && isFetching && variables.length === 0 ? (
        <div className="space-y-2 p-4">
          <div className="h-9 w-full animate-pulse rounded bg-muted" />
          <div className="h-9 w-full animate-pulse rounded bg-muted" />
        </div>
      ) : null}

      {!error && !isFetching && variables.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <KeyRound className="size-6 text-muted-foreground" />
          <div className="font-medium text-foreground text-sm">还没有构建变量</div>
          <div className="text-muted-foreground text-xs">
            新增变量后，构建时会以 --build-arg 或 BuildKit secret 的形式传给 Dockerfile
          </div>
        </div>
      ) : null}

      {!error && variables.length > 0 ? (
        <div className="overflow-hidden">
          <div
            className={`hidden border-border border-b bg-muted px-4 py-2 font-medium text-muted-foreground text-xs xl:grid ${gridColumns}`}
          >
            <span>Key</span>
            <span>作用环境</span>
            <span>值</span>
            <span>密钥</span>
            <span>更新人</span>
            <span>更新时间</span>
            <span>操作</span>
          </div>
          <div className="divide-y divide-border">
            {variables.map((variable) => (
              <div
                key={`${variable.key}:${variable.environmentCode}`}
                className={`grid gap-2 px-4 py-3 text-sm xl:items-center ${gridColumns}`}
              >
                <Cell label="Key">
                  <span className="break-all font-mono font-semibold text-foreground text-xs">
                    {variable.key}
                  </span>
                </Cell>
                <Cell label="作用环境">
                  {variable.environmentCode ? (
                    <Badge variant="info">
                      {environmentLabels.get(variable.environmentCode) ?? variable.environmentCode}
                    </Badge>
                  ) : (
                    <Badge variant="neutral">全部环境</Badge>
                  )}
                </Cell>
                <Cell label="值">
                  <span className="line-clamp-2 break-all font-mono text-muted-foreground text-xs">
                    {variable.isSecret ? buildVariableSecretMask : variable.value || "（空）"}
                  </span>
                </Cell>
                <Cell label="密钥">
                  {variable.isSecret ? (
                    <Badge variant="warning">是</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">否</span>
                  )}
                </Cell>
                <Cell label="更新人">
                  <span className="truncate text-foreground text-xs">
                    {variable.updatedBy || variable.updatedByUserId || "-"}
                  </span>
                </Cell>
                <Cell label="更新时间">
                  <span className="font-mono text-muted-foreground text-xs">
                    {formatDateTime(variable.updatedAt)}
                  </span>
                </Cell>
                <Cell label="操作">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="link"
                      type="button"
                      disabled={!canManage}
                      className="h-auto gap-1 p-0 text-primary text-xs hover:text-primary/80 disabled:text-muted-foreground"
                      onClick={() => {
                        setSubmitError("");
                        setDialogState({ isOpen: true, variable });
                      }}
                    >
                      <Pencil className="size-3.5" />
                      编辑
                    </Button>
                    <Button
                      variant="link"
                      type="button"
                      disabled={!canManage}
                      className="h-auto gap-1 p-0 text-destructive text-xs hover:text-destructive/80 disabled:text-muted-foreground"
                      onClick={() => {
                        setActionError("");
                        setDeleteTarget(variable);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      删除
                    </Button>
                  </div>
                </Cell>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <BuildVariableDialog
        environmentOptions={environmentOptions}
        existingVariables={variables}
        isOpen={dialogState.isOpen}
        submitError={submitError}
        variable={dialogState.variable}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        isPending={isDeleting}
        tone="danger"
        title="删除构建变量"
        confirmLabel="删除"
        description={
          deleteTarget
            ? `确认删除「${deleteTarget.key}」（${
                deleteTarget.environmentCode
                  ? (environmentLabels.get(deleteTarget.environmentCode) ??
                    deleteTarget.environmentCode)
                  : "全部环境"
              }）？之后的构建将不再注入该变量。`
            : ""
        }
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </Card>
  );
}

function Cell({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="w-16 shrink-0 text-muted-foreground text-xs xl:hidden">{label}</span>
      {children}
    </div>
  );
}
