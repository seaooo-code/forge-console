import { Card } from "@/components/ui/card";

export function ApplicationsPageLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="h-22 animate-pulse rounded-xl border-border bg-card shadow-xs" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {["total", "running", "maintenance", "offline"].map((item) => (
          <Card
            key={item}
            className="h-28 animate-pulse rounded-xl border-border bg-card shadow-xs"
          />
        ))}
      </div>
      <Card className="h-96 animate-pulse rounded-xl border-border bg-card shadow-xs" />
    </div>
  );
}
