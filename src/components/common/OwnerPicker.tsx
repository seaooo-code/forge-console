import { LoaderCircle } from "lucide-react";
import { type Ref, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type OwnerSearchUser = {
  avatarUrl?: string;
  email?: string;
  enName?: string;
  id?: string;
  name?: string;
  openId?: string;
  unionId?: string;
  userId?: string;
};

type OwnerPickerProps<TUser extends OwnerSearchUser> = {
  className?: string;
  inputName?: string;
  inputRef?: Ref<HTMLInputElement>;
  onBlur?: () => void;
  onChange: (value: string) => void;
  onSelect?: (user: TUser) => void;
  placeholder?: string;
  searchUsers: (query: string) => Promise<TUser[]>;
  value: string;
};

export function OwnerPicker<TUser extends OwnerSearchUser>({
  className,
  inputName,
  inputRef,
  onBlur,
  onChange,
  onSelect,
  placeholder = "搜索负责人姓名、邮箱或账号",
  searchUsers,
  value,
}: OwnerPickerProps<TUser>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<TUser | null>(null);
  const [users, setUsers] = useState<TUser[]>([]);

  useEffect(() => {
    if (selectedOwner && getOwnerDisplayName(selectedOwner) !== value) {
      setSelectedOwner(null);
    }
  }, [selectedOwner, value]);

  useEffect(() => {
    const query = value.trim();
    if (!isOpen || selectedOwner || query.length < 2) {
      setUsers([]);
      setIsLoading(false);
      return;
    }

    let disposed = false;
    setIsLoading(true);
    const handle = window.setTimeout(() => {
      void searchUsers(query)
        .then((nextUsers) => {
          if (!disposed) {
            setUsers(nextUsers);
          }
        })
        .catch(() => {
          if (!disposed) {
            setUsers([]);
          }
        })
        .finally(() => {
          if (!disposed) {
            setIsLoading(false);
          }
        });
    }, 280);

    return () => {
      disposed = true;
      window.clearTimeout(handle);
    };
  }, [isOpen, searchUsers, selectedOwner, value]);

  const handleInputChange = (nextValue: string) => {
    setIsOpen(true);
    setSelectedOwner(null);
    onChange(nextValue);
  };

  const handleOwnerSelect = (user: TUser) => {
    const ownerName = getOwnerDisplayName(user);
    setIsOpen(false);
    setUsers([]);
    setSelectedOwner(user);
    onChange(ownerName || value);
    onSelect?.(user);
  };

  return (
    <div className={cn("relative", className)}>
      {selectedOwner ? (
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-start gap-2 px-3 font-normal text-slate-900 hover:bg-white hover:text-slate-900"
          onClick={() => {
            setSelectedOwner(null);
            setIsOpen(true);
          }}
        >
          <OwnerAvatar user={selectedOwner} />
          <span className="min-w-0 truncate">{getOwnerDisplayName(selectedOwner)}</span>
        </Button>
      ) : (
        <Input
          name={inputName}
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          onBlur={() => {
            onBlur?.();
            window.setTimeout(() => setIsOpen(false), 150);
          }}
          onChange={(event) => handleInputChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
        />
      )}
      {isOpen && !selectedOwner ? (
        <OwnerSearchResults
          isLoading={isLoading}
          onSelect={handleOwnerSelect}
          query={value}
          users={users}
        />
      ) : null}
    </div>
  );
}

function OwnerSearchResults<TUser extends OwnerSearchUser>({
  isLoading,
  onSelect,
  query,
  users,
}: {
  isLoading: boolean;
  onSelect: (user: TUser) => void;
  query: string;
  users: TUser[];
}) {
  if (query.trim().length < 2) {
    return null;
  }

  return (
    <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg">
      {isLoading ? (
        <div className="flex h-10 items-center gap-2 px-3 text-slate-500 text-sm">
          <LoaderCircle className="size-4 animate-spin" />
          搜索中
        </div>
      ) : null}
      {!isLoading && users.length === 0 ? (
        <div className="px-3 py-2 text-slate-500 text-sm">未找到匹配人员</div>
      ) : null}
      {users.map((user, index) => (
        <Button
          key={getOwnerKey(user, index)}
          type="button"
          variant="ghost"
          className="h-auto w-full justify-start gap-3 rounded-none px-3 py-2 text-left font-normal hover:bg-slate-50"
          onClick={() => onSelect(user)}
        >
          <OwnerAvatar user={user} className="size-8" />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium text-slate-900 text-sm">
              {getOwnerDisplayName(user)}
            </span>
            {user.email ? (
              <span className="block truncate text-slate-500 text-xs">{user.email}</span>
            ) : null}
          </span>
        </Button>
      ))}
    </div>
  );
}

function OwnerAvatar({
  className = "size-6",
  user,
}: {
  className?: string;
  user: OwnerSearchUser;
}) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={getOwnerDisplayName(user)}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-rose-500 font-semibold text-white text-xs`}
    >
      {getOwnerInitial(user)}
    </span>
  );
}

function getOwnerDisplayName(user: OwnerSearchUser) {
  return user.name || user.enName || user.email || "";
}

function getOwnerInitial(user: OwnerSearchUser) {
  const name = getOwnerDisplayName(user).trim();
  return name ? name.slice(0, 1).toUpperCase() : "?";
}

function getOwnerKey(user: OwnerSearchUser, index: number) {
  return (
    user.id || user.unionId || user.openId || user.userId || `${getOwnerDisplayName(user)}-${index}`
  );
}
