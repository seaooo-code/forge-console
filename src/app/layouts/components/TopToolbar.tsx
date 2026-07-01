import { Bell, CircleHelp, LogOut, Search, SlidersHorizontal } from "lucide-react";
import { useNavigate } from "react-router";

import { logoutAuthSession } from "@/api/feishu-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/use-auth-store";

import { ThemeToggle } from "./ThemeToggle";

export function TopToolbar() {
  const navigate = useNavigate();
  const session = useAuthStore((state) => state.session);
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = session?.user;

  if (!user) {
    return null;
  }

  const displayName = user.name;
  const email = user.enterpriseEmail;
  const avatarURL = user.avatarThumb;
  const initials = getInitials(displayName);

  const handleLogout = async () => {
    try {
      await logoutAuthSession();
    } finally {
      clearSession();
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-18 items-center justify-between gap-4 border-border border-b bg-card/95 px-6 backdrop-blur">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-9 min-w-65 max-w-130 flex-1 items-center gap-2 rounded-md bg-muted px-3 text-muted-foreground">
          <Search className="size-4 shrink-0" />
          <Input
            className="h-auto min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
            placeholder="搜索 任务 / 模块 / Bundle / 发布单 ..."
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="高级筛选">
          <SlidersHorizontal className="size-4" />
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" aria-label="帮助">
          <CircleHelp className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="通知">
          <Bell className="size-4" />
        </Button>
        <div className="flex items-center gap-2 pl-2">
          <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground text-sm">
            {avatarURL ? (
              <img alt={displayName} className="size-full object-cover" src={avatarURL} />
            ) : (
              initials
            )}
          </div>
          <div className="hidden leading-tight xl:block">
            <div className="max-w-36 truncate font-semibold text-foreground text-sm">
              {displayName}
            </div>
            {email ? (
              <div className="max-w-42 truncate text-muted-foreground text-xs">{email}</div>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" aria-label="退出登录" onClick={handleLogout}>
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>
    </header>
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

  return normalizedValue.slice(0, 2);
}
