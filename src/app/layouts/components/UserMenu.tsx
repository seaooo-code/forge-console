import { LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { logoutAuthSession } from "@/api/feishu-auth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuthStore } from "@/store/use-auth-store";

export function UserMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = session?.user;

  if (!user) {
    return null;
  }

  const displayName = user.name ?? "";
  const role = session.roles[0] ?? "成员";

  const handleLogout = async () => {
    setOpen(false);
    try {
      await logoutAuthSession();
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          type="button"
          className="h-auto min-w-0 flex-1 justify-start gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-foreground/5"
        >
          <UserAvatar avatarURL={user.avatarUrl} name={displayName} />
          <span className="min-w-0 text-left leading-tight">
            <span className="block truncate font-medium text-foreground text-sm">
              {displayName}
            </span>
            <span className="block truncate font-normal text-faint text-xs">{role}</span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        className="w-60 rounded-xl border-0 p-1.5 shadow-raise"
        sideOffset={8}
      >
        <div className="flex items-center gap-2.5 px-2 py-2">
          <UserAvatar avatarURL={user.avatarUrl} name={displayName} />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-medium text-sm">{displayName}</div>
            {user.email ? <div className="truncate text-faint text-xs">{user.email}</div> : null}
            {session.activeTenant.name ? (
              <div className="truncate text-faint text-xs">租户：{session.activeTenant.name}</div>
            ) : null}
          </div>
        </div>
        <Button
          variant="ghost"
          type="button"
          onClick={handleLogout}
          className="mt-1 h-8 w-full justify-start gap-2 rounded-md px-2 font-normal text-destructive text-sm hover:bg-destructive-soft hover:text-destructive"
        >
          <LogOut />
          退出登录
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function UserAvatar({ avatarURL, name }: { avatarURL?: string; name: string }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground font-medium text-background text-xs">
      {avatarURL ? (
        <img alt={name} className="size-full object-cover" src={avatarURL} />
      ) : (
        getInitials(name)
      )}
    </span>
  );
}

function getInitials(value: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return "FS";
  }

  if (/^[a-zA-Z]/.test(normalizedValue)) {
    return normalizedValue
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase())
      .join("");
  }

  return normalizedValue.slice(0, 1);
}
