import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CircleArrowUp,
  Database,
  GitFork,
  KeyRound,
  Layers,
  LayoutGrid,
  Package,
  Server,
  Smartphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useConsoleLayoutStore } from "../model/use-console-layout-store";
import type { NavGroup, NavIconName, NavItem } from "../types";
import { ApplicationSwitcher } from "./ApplicationSwitcher";
import { ThemeSwitch } from "./ThemeSwitch";
import { UserMenu } from "./UserMenu";

const navIcons: Record<NavIconName, LucideIcon> = {
  accessToken: KeyRound,
  app: Smartphone,
  build: Package,
  buildAdapter: Layers,
  codeSource: GitFork,
  environment: Server,
  module: LayoutGrid,
  overview: Activity,
  releaseRecord: CircleArrowUp,
  storage: Database,
};

type AppSidebarProps = {
  navGroups: NavGroup[];
  onNavigate: (item: NavItem) => void;
};

export function AppSidebar({ navGroups, onNavigate }: AppSidebarProps) {
  const activeNavId = useConsoleLayoutStore((state) => state.activeNavId);

  return (
    <aside className="flex w-full shrink-0 flex-col px-3 pt-3 pb-2 lg:sticky lg:top-0 lg:h-screen lg:w-57">
      <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-4">
        <span className="flex size-6 items-center justify-center rounded-md bg-primary font-semibold text-[10px] text-primary-foreground">
          RN
        </span>
        <span className="font-semibold text-foreground text-sm">RN Bundle 平台</span>
      </div>

      <ApplicationSwitcher />

      <nav aria-label="主导航" className="mt-4 flex-1 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label ?? "main"} className={cn(group.label && "mt-4")}>
            {group.label ? (
              <div className="px-2.5 pb-1.5 text-faint text-xs">{group.label}</div>
            ) : null}
            <div className="flex flex-col gap-px">
              {group.items.map((item) => (
                <NavLink
                  key={item.id}
                  active={activeNavId === item.id}
                  icon={navIcons[item.icon]}
                  item={item}
                  onClick={() => onNavigate(item)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2 pt-2">
        <UserMenu />
        <ThemeSwitch />
      </div>
    </aside>
  );
}

type NavLinkProps = {
  active: boolean;
  icon: LucideIcon;
  item: NavItem;
  onClick: () => void;
};

function NavLink({ active, icon: Icon, item, onClick }: NavLinkProps) {
  return (
    <Button
      variant="ghost"
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "h-8.5 w-full justify-start gap-2.5 rounded-lg px-2.5 font-normal text-sm",
        active
          ? "bg-background font-medium text-foreground shadow-edge hover:bg-background [&_svg]:text-primary"
          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground [&_svg]:text-faint hover:[&_svg]:text-muted-foreground",
      )}
    >
      <Icon />
      <span className="truncate">{item.label}</span>
    </Button>
  );
}
