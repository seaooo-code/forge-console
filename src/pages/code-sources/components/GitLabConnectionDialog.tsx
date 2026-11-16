import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Field } from "@/components/common/Field";
import { Modal, ModalFooter, ModalHeader } from "@/components/common/Modal";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { connectionNameMaxLength, defaultGitLabConnectionForm } from "../constants";
import type { CodeSourceConnection, GitLabConnectionFormValues } from "../types";
import { validateInstanceURL } from "../utils";

/** connection 为空时新建 GitLab 连接，否则编辑该连接的名称和 Access Token。 */
export function GitLabConnectionDialog({
  connection,
  isOpen,
  onClose,
  onSubmit,
  submitError,
}: {
  connection: CodeSourceConnection | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: GitLabConnectionFormValues) => Promise<void>;
  submitError: string;
}) {
  const isEdit = connection !== null;
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<GitLabConnectionFormValues>({ defaultValues: defaultGitLabConnectionForm });

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    reset(
      connection
        ? { credential: "", name: connection.name, webBaseUrl: connection.webBaseUrl }
        : defaultGitLabConnectionForm,
    );
  }, [connection, isOpen, reset]);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      labelledBy="gitlab-connection-dialog-title"
      describedBy="gitlab-connection-dialog-description"
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalHeader
          title={isEdit ? "编辑 GitLab 连接" : "新建 GitLab 连接"}
          description={
            isEdit
              ? "可修改名称或更换 Access Token；填写新令牌后保存时会重新校验。"
              : "使用 Group 或 Project Access Token（scope 需包含 read_api 和 read_repository），保存时会自动校验。"
          }
          titleId="gitlab-connection-dialog-title"
          descriptionId="gitlab-connection-dialog-description"
        />

        <div className="mt-4 space-y-4">
          <Field
            label="名称"
            htmlFor="gitlab-connection-name"
            required
            error={errors.name?.message}
          >
            <Input
              id="gitlab-connection-name"
              placeholder="例如：公司 GitLab"
              aria-invalid={Boolean(errors.name)}
              {...register("name", {
                maxLength: {
                  message: `名称不能超过 ${connectionNameMaxLength} 个字符`,
                  value: connectionNameMaxLength,
                },
                validate: (value) => value.trim() !== "" || "请输入连接名称",
              })}
            />
          </Field>
          <Field
            label="实例地址"
            htmlFor="gitlab-connection-web-base-url"
            required={!isEdit}
            hint={isEdit ? "实例地址创建后不可修改" : "例如 https://gitlab.com 或自建实例地址"}
            error={errors.webBaseUrl?.message}
          >
            <Input
              id="gitlab-connection-web-base-url"
              placeholder="https://gitlab.example.com"
              disabled={isEdit}
              aria-invalid={Boolean(errors.webBaseUrl)}
              {...register("webBaseUrl", { validate: isEdit ? undefined : validateInstanceURL })}
            />
          </Field>
          <Field
            label="Access Token"
            htmlFor="gitlab-connection-credential"
            required={!isEdit}
            hint={
              isEdit
                ? `留空则沿用当前凭证${connection?.credentialPreview ? `（${connection.credentialPreview}）` : ""}`
                : "令牌加密保存，之后只展示脱敏预览"
            }
            error={errors.credential?.message}
          >
            <Input
              id="gitlab-connection-credential"
              type="password"
              autoComplete="off"
              placeholder={isEdit ? "留空不修改" : "glpat-..."}
              aria-invalid={Boolean(errors.credential)}
              {...register("credential", {
                validate: (value) => isEdit || value.trim() !== "" || "请输入 Access Token",
              })}
            />
          </Field>
          {submitError ? <Alert variant="danger">{submitError}</Alert> : null}
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" disabled={isSubmitting} onClick={handleClose}>
            取消
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "校验并保存中" : "保存"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
