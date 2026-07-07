import { LogOut, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { logoutAuthSession } from "@/api/feishu-auth";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-border border-b bg-card/95 px-6 backdrop-blur">
      <div className="flex min-w-0 flex-1 items-center">
        <search
          className={cn(
            "flex h-9 max-w-130 min-w-65 flex-1 items-center gap-2 rounded-md bg-muted px-3 text-muted-foreground transition-colors",
            "focus-within:bg-background focus-within:ring-2 focus-within:ring-ring/40",
          )}
        >
          <Search className="size-3.5 shrink-0" />
          <Input
            disabled
            aria-label="全局搜索（即将推出）"
            className="h-auto min-w-0 flex-1 cursor-not-allowed border-0 bg-transparent px-0 py-0 text-sm shadow-none placeholder:text-muted-foreground focus-visible:ring-0 disabled:opacity-100"
            placeholder="搜索 任务 / 模块 / Bundle / 发布单 ..."
          />
          <kbd className="hidden rounded border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline">
            ⌘K
          </kbd>
        </search>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <ThemeToggle />
        <UserMenu
          avatarURL={avatarURL}
          displayName={displayName}
          email={email}
          initials={initials}
          onLogout={handleLogout}
        />
      </div>
    </header>
  );
}

type UserMenuProps = {
  avatarURL?: string;
  displayName: string;
  email?: string;
  initials: string;
  onLogout: () => void;
};

function UserMenu({ avatarURL, displayName, email, initials, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2.5 rounded-md p-1 pr-2 transition-colors hover:bg-muted"
      >
        <div className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground text-xs ring-1 ring-inset ring-primary/30">
          {avatarURL ? (
            <img alt={displayName} className="size-full object-cover" src={avatarURL} />
          ) : (
            initials
          )}
        </div>
        <div className="hidden text-left leading-tight xl:block">
          <div className="max-w-32 truncate font-semibold text-foreground text-sm">
            {displayName}
          </div>
          {email ? (
            <div className="max-w-44 truncate text-muted-foreground text-xs">{email}</div>
          ) : null}
        </div>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <div className="flex items-center gap-2.5 border-border border-b px-3 py-2.5">
            <div className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground text-xs">
              {avatarURL ? (
                <img alt={displayName} className="size-full object-cover" src={avatarURL} />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate font-semibold text-foreground text-sm">{displayName}</div>
              {email ? <div className="truncate text-muted-foreground text-xs">{email}</div> : null}
            </div>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-destructive text-sm transition-colors hover:bg-destructive/10"
          >
            <LogOut className="size-4" />
            退出登录
          </button>
        </div>
      ) : null}
    </div>
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
