import {
  Bell,
  Cloud,
  Database,
  GitBranch,
  KeyRound,
  LockKeyhole,
  type LucideIcon,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import type { MemberStatus } from "../types";

export const navIconMap: Record<string, LucideIcon> = {
  cdn: Cloud,
  notice: Bell,
  permissions: LockKeyhole,
  pipelines: GitBranch,
  roles: ShieldCheck,
  sign: KeyRound,
  storage: Database,
  users: UsersRound,
};

export const statusClass: Record<MemberStatus, string> = {
  停用: "border-border bg-muted text-muted-foreground",
  启用: "border-success/30 bg-success/10 text-success",
};
