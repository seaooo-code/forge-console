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
  停用: "border-slate-200 bg-slate-100 text-slate-600",
  启用: "border-emerald-200 bg-emerald-50 text-emerald-700",
};
