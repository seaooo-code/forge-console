import { PenLine, Plus, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "@/components/common/Drawer";
import { Field } from "@/components/common/Field";
import { SectionCard } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useApplicationChannels } from "../hooks";

const channelCodePattern = /^[a-z][a-z0-9-]{0,31}$/;

/**
 * 应用的发布渠道。客户端打包时写死渠道标识、拉包时上报，发布可以限定只对某个渠道生效，
 * 渠道里没有发布的模块回落到默认渠道。规则见 forge-server/docs/channels.md。
 */
export function ApplicationChannelsSection({
  applicationSlug,
  canManage,
}: {
  applicationSlug: string;
  canManage: boolean;
}) {
  const {
    actionError,
    channels,
    closeForm,
    confirmDelete,
    deleteTarget,
    form,
    formTarget,
    isDeleting,
    isLoading,
    loadError,
    openForm,
    setActionError,
    setDeleteTarget,
    submitForm,
  } = useApplicationChannels(applicationSlug);
  const {
    formState: { errors, isSubmitting },
    register,
  } = form;
  const isEditing = Boolean(formTarget);

  return (
    <>
      <SectionCard
        title="发布渠道"
        description="内测包等单独打包的 App 在拉包时上报渠道标识，只拿到发布到该渠道的包；渠道里没有发布的模块照常拿默认渠道的包。"
        actions={
          canManage ? (
            <Button size="sm" onClick={() => openForm(null)}>
              <Plus className="size-4" />
              新建渠道
            </Button>
          ) : null
        }
      >
        <div className="space-y-3">
          {loadError ? <Alert variant="danger">{loadError.message}</Alert> : null}
          {!isLoading && !loadError && channels.length === 0 ? (
            <div className="rounded-md bg-surface-2 px-3 py-6 text-center text-muted-foreground text-sm">
              还没有渠道。所有客户端都使用默认渠道。
            </div>
          ) : null}
          {channels.map((channel) => (
            <div
              key={channel.code}
              className="flex items-center justify-between gap-3 rounded-md bg-surface-2 px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold text-foreground text-sm">
                    {channel.name}
                  </span>
                  <code className="rounded bg-card px-1.5 py-0.5 font-mono text-muted-foreground text-xs">
                    {channel.code}
                  </code>
                </div>
                {channel.description ? (
                  <div className="mt-0.5 truncate text-muted-foreground text-xs">
                    {channel.description}
                  </div>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="text-muted-foreground">
                  {channel.activeReleases} 个生效发布
                </Badge>
                {canManage ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8"
                      aria-label={`编辑渠道 ${channel.code}`}
                      onClick={() => openForm(channel)}
                    >
                      <PenLine className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-8 text-destructive hover:bg-destructive-soft hover:text-destructive"
                      disabled={channel.activeReleases > 0}
                      title={
                        channel.activeReleases > 0 ? "先停用该渠道的生效发布再删除" : undefined
                      }
                      aria-label={`删除渠道 ${channel.code}`}
                      onClick={() => {
                        setActionError("");
                        setDeleteTarget(channel);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <Drawer
        isOpen={formTarget !== undefined}
        onClose={closeForm}
        labelledBy="release-channel-form-title"
        describedBy="release-channel-form-description"
        className="max-w-lg"
      >
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={submitForm}>
          <DrawerHeader
            onClose={closeForm}
            title={isEditing ? "编辑渠道" : "新建渠道"}
            titleId="release-channel-form-title"
            descriptionId="release-channel-form-description"
            description={
              isEditing
                ? "渠道标识已写进客户端，创建后不能修改。"
                : "渠道标识要和客户端打包时写入的值一致，创建后不能修改。"
            }
          />
          <DrawerBody className="space-y-5">
            <Field
              label="渠道标识"
              htmlFor="release-channel-code"
              required
              hint="小写字母开头，只含小写字母、数字和连字符，最长 32 个字符，例如 beta。"
              error={errors.code?.message}
            >
              <Input
                id="release-channel-code"
                className="font-mono"
                disabled={isEditing}
                placeholder="beta"
                {...register("code", {
                  validate: (value) =>
                    isEditing ||
                    channelCodePattern.test(value.trim()) ||
                    "标识格式不正确：小写字母开头，只含小写字母、数字和连字符",
                })}
              />
            </Field>
            <Field
              label="名称"
              htmlFor="release-channel-name"
              required
              error={errors.name?.message}
            >
              <Input
                id="release-channel-name"
                placeholder="内测"
                {...register("name", {
                  maxLength: { message: "名称最多 50 个字符", value: 50 },
                  validate: (value) => value.trim() !== "" || "请填写名称",
                })}
              />
            </Field>
            <Field
              label="说明"
              htmlFor="release-channel-description"
              error={errors.description?.message}
            >
              <Textarea
                id="release-channel-description"
                rows={3}
                placeholder="例如：内测 App 专用，打包时写入 channel=beta"
                {...register("description", {
                  maxLength: { message: "说明最多 200 个字符", value: 200 },
                })}
              />
            </Field>
            {actionError ? <Alert variant="danger">{actionError}</Alert> : null}
          </DrawerBody>
          <DrawerFooter>
            <Button variant="outline" type="button" disabled={isSubmitting} onClick={closeForm}>
              取消
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? "保存" : "创建渠道"}
            </Button>
          </DrawerFooter>
        </form>
      </Drawer>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        isPending={isDeleting}
        title="删除渠道"
        description={
          deleteTarget
            ? `确认删除渠道「${deleteTarget.name}（${deleteTarget.code}）」？之后上报该渠道的客户端会按默认渠道拉包，历史发布记录保留。`
            : ""
        }
        confirmLabel="删除渠道"
        tone="danger"
        onCancel={() => {
          if (isDeleting) {
            return;
          }
          setDeleteTarget(null);
          setActionError("");
        }}
        onConfirm={() => {
          void confirmDelete();
        }}
      >
        {actionError ? <Alert variant="danger">{actionError}</Alert> : null}
      </ConfirmDialog>
    </>
  );
}
