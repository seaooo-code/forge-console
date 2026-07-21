import { Plus, Trash2 } from "lucide-react";
import { Controller } from "react-hook-form";

import { searchFeishuUsers } from "@/api/feishu-user-search";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { OwnerPicker } from "@/components/common/OwnerPicker";
import { SectionCard } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FeishuUserSearchResult } from "@/types/feishu";

import { useApplicationMembers } from "../hooks";
import type { ApplicationMemberRecord } from "../types";
import { memberDisplayName } from "../utils";

export const applicationMemberRoleOptions: ReadonlyArray<{
  label: string;
  value: ApplicationMemberRecord["role"];
}> = [
  { label: "Owner", value: "Owner" },
  { label: "Developer", value: "Developer" },
  { label: "QA", value: "QA" },
  { label: "Release", value: "Release" },
];

type ApplicationMembersSectionProps = {
  applicationSlug: string;
  canManageMembers: boolean;
  members: ApplicationMemberRecord[];
  refreshApplicationDetail: () => Promise<void>;
  updateMembers: (members: ApplicationMemberRecord[]) => void;
};

export function ApplicationMembersSection({
  applicationSlug,
  canManageMembers,
  members,
  refreshApplicationDetail,
  updateMembers,
}: ApplicationMembersSectionProps) {
  const {
    deleteMemberTarget,
    handleAddMember,
    handleConfirmDeleteMember,
    handleConfirmRoleChange,
    isMutatingMember,
    memberFormControl,
    memberFormErrors,
    memberActionError,
    selectedMemberUserId,
    setDeleteMemberTarget,
    setMemberActionError,
    setMemberFormValue,
    setRoleChangeTarget,
    roleChangeTarget,
  } = useApplicationMembers(
    applicationSlug,
    canManageMembers,
    members,
    updateMembers,
    refreshApplicationDetail,
  );

  return (
    <>
      <SectionCard
        title="成员权限"
        description="维护应用成员的角色与接入权限"
        actions={
          <Badge variant="outline" className="border-border text-muted-foreground">
            {members.length} 人
          </Badge>
        }
      >
        <div className="space-y-3">
          {canManageMembers ? (
            <form className="space-y-2" onSubmit={handleAddMember}>
              <div className="grid gap-2 md:grid-cols-[1fr_8.5rem_auto]">
                <Controller
                  control={memberFormControl}
                  name="memberName"
                  rules={{
                    validate: () => Boolean(selectedMemberUserId) || "请选择成员",
                  }}
                  render={({ field }) => (
                    <OwnerPicker<FeishuUserSearchResult>
                      value={field.value}
                      inputName={field.name}
                      inputRef={field.ref}
                      placeholder="搜索成员姓名、邮箱或账号"
                      searchUsers={searchFeishuUsers}
                      onBlur={field.onBlur}
                      onChange={(value) => {
                        field.onChange(value);
                        setMemberFormValue("userId", "", { shouldValidate: true });
                      }}
                      onSelect={(user) => {
                        setMemberFormValue("userId", user.id, { shouldValidate: true });
                      }}
                    />
                  )}
                />
                <Controller
                  control={memberFormControl}
                  name="role"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {applicationMemberRoleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Button
                  type="submit"
                  disabled={!selectedMemberUserId || isMutatingMember}
                  loading={isMutatingMember}
                >
                  <Plus className="size-4" />
                  添加
                </Button>
              </div>
              {memberFormErrors.memberName ? (
                <div className="text-destructive text-xs">
                  {memberFormErrors.memberName.message}
                </div>
              ) : null}
            </form>
          ) : null}
          {memberActionError ? <Alert variant="danger">{memberActionError}</Alert> : null}
          {members.map((member) => (
            <MemberRow
              key={member.id}
              canManage={canManageMembers}
              disabled={isMutatingMember}
              member={member}
              onDelete={(target) => {
                setMemberActionError("");
                setDeleteMemberTarget(target);
              }}
              onRoleChange={(target, role) => {
                if (target.role === role) {
                  return;
                }
                setMemberActionError("");
                setRoleChangeTarget({ member: target, role });
              }}
            />
          ))}
        </div>
      </SectionCard>

      <ConfirmDialog
        isOpen={roleChangeTarget !== null}
        isPending={isMutatingMember}
        title="修改成员角色"
        description={
          roleChangeTarget
            ? `确认将「${memberDisplayName(roleChangeTarget.member)}」的角色修改为 ${roleChangeTarget.role}？`
            : ""
        }
        confirmLabel="修改角色"
        onCancel={() => {
          if (isMutatingMember) {
            return;
          }
          setRoleChangeTarget(null);
          setMemberActionError("");
        }}
        onConfirm={() => {
          void handleConfirmRoleChange();
        }}
      >
        {memberActionError ? <Alert variant="danger">{memberActionError}</Alert> : null}
      </ConfirmDialog>
      <ConfirmDialog
        isOpen={deleteMemberTarget !== null}
        isPending={isMutatingMember}
        title="移除成员"
        description={
          deleteMemberTarget
            ? `确认移除「${memberDisplayName(deleteMemberTarget)}」的应用权限？`
            : ""
        }
        confirmLabel="移除成员"
        tone="danger"
        onCancel={() => {
          if (isMutatingMember) {
            return;
          }
          setDeleteMemberTarget(null);
          setMemberActionError("");
        }}
        onConfirm={() => {
          void handleConfirmDeleteMember();
        }}
      >
        {memberActionError ? <Alert variant="danger">{memberActionError}</Alert> : null}
      </ConfirmDialog>
    </>
  );
}

function MemberRow({
  canManage,
  disabled,
  member,
  onDelete,
  onRoleChange,
}: {
  canManage: boolean;
  disabled: boolean;
  member: ApplicationMemberRecord;
  onDelete: (member: ApplicationMemberRecord) => void;
  onRoleChange: (member: ApplicationMemberRecord, role: ApplicationMemberRecord["role"]) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <MemberAvatar member={member} />
        <div className="min-w-0">
          <div className="truncate font-semibold text-foreground text-sm">
            {memberDisplayName(member)}
          </div>
          <div className="mt-0.5 truncate text-muted-foreground text-xs">
            {member.email || member.team || member.userId}
          </div>
        </div>
      </div>
      {canManage ? (
        <div className="flex shrink-0 items-center gap-2">
          <Select
            value={member.role}
            disabled={disabled}
            onValueChange={(role) => onRoleChange(member, role as ApplicationMemberRecord["role"])}
          >
            <SelectTrigger className="h-8 w-30 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {applicationMemberRoleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={disabled}
            aria-label="移除成员权限"
            onClick={() => onDelete(member)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : (
        <Badge variant="outline" className="border-info/30 bg-info/10 text-info">
          {member.role}
        </Badge>
      )}
    </div>
  );
}

function MemberAvatar({ member }: { member: ApplicationMemberRecord }) {
  const name = memberDisplayName(member);
  if (member.avatarUrl) {
    return <img src={member.avatarUrl} alt={name} className="size-8 rounded-full object-cover" />;
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
      {name.trim().slice(0, 1).toUpperCase()}
    </span>
  );
}
