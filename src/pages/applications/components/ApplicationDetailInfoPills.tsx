import type { LucideIcon } from "lucide-react";

export function InfoPill({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">{label}</div>
        <div className="truncate font-semibold text-foreground text-sm">{value}</div>
      </div>
    </div>
  );
}

export function OwnerInfoPill({
  avatarUrl,
  email,
  name,
}: {
  avatarUrl: string;
  email: string;
  name: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
      <OwnerAvatar avatarUrl={avatarUrl} name={name} />
      <div className="min-w-0">
        <div className="text-muted-foreground text-xs">负责人</div>
        <div className="truncate font-semibold text-foreground text-sm">{name}</div>
        {email ? <div className="truncate text-muted-foreground text-xs">{email}</div> : null}
      </div>
    </div>
  );
}

export function OwnerAvatar({ avatarUrl, name }: { avatarUrl: string; name: string }) {
  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className="size-8 shrink-0 rounded-full object-cover" />;
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-xs">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function ConfigItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 gap-3 rounded-md border border-border bg-card px-3 py-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-muted-foreground text-xs">{label}</div>
        <div className="mt-1 break-all font-semibold text-foreground text-sm">{value}</div>
      </div>
    </div>
  );
}
