import { useQuery } from "@tanstack/react-query";
import { Activity, Database, Gauge, Moon, RefreshCw, Rows3, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { consoleSnapshotQueryKey, fetchConsoleSnapshot } from "./api/console-snapshot";
import { ChartPanel } from "./components/ChartPanel";
import { DataGridPanel } from "./components/DataGridPanel";
import { EditorPanel } from "./components/EditorPanel";
import { type Density, useConsoleStore } from "./model/use-console-store";

function formatTime(value?: string) {
  if (!value) {
    return "pending";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

export function ConsoleDashboard() {
  const density = useConsoleStore((state) => state.density);
  const selectedPipelineId = useConsoleStore((state) => state.selectedPipelineId);
  const setDensity = useConsoleStore((state) => state.setDensity);
  const setEditorValue = useConsoleStore((state) => state.setEditorValue);
  const setSelectedPipelineId = useConsoleStore((state) => state.setSelectedPipelineId);
  const theme = useConsoleStore((state) => state.theme);
  const toggleTheme = useConsoleStore((state) => state.toggleTheme);

  const { data, isFetching, refetch } = useQuery({
    queryKey: consoleSnapshotQueryKey,
    queryFn: fetchConsoleSnapshot,
    refetchInterval: 18_000,
  });

  const rows = data?.pipelines ?? [];
  const metrics = data?.metrics ?? [];

  const selectedPipeline = useMemo(
    () => rows.find((row) => row.id === selectedPipelineId) ?? rows[0],
    [rows, selectedPipelineId],
  );

  const totals = useMemo(() => {
    const blocked = rows.filter((row) => row.status === "blocked").length;
    const warnings = rows.filter((row) => row.status === "warning").length;
    const deploys = rows.reduce((sum, row) => sum + row.deploys, 0);
    const spend = rows.reduce((sum, row) => sum + row.cost, 0);

    return { blocked, warnings, deploys, spend };
  }, [rows]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (selectedPipeline && selectedPipeline.id !== selectedPipelineId) {
      setSelectedPipelineId(selectedPipeline.id);
    }
  }, [selectedPipeline, selectedPipelineId, setSelectedPipelineId]);

  useEffect(() => {
    if (!selectedPipeline) {
      return;
    }

    setEditorValue(
      JSON.stringify(
        {
          pipelineId: selectedPipeline.id,
          service: selectedPipeline.service,
          environment: selectedPipeline.environment,
          rollout: {
            region: selectedPipeline.region,
            strategy: selectedPipeline.status === "blocked" ? "hold" : "progressive",
            maxFailureRate: 3,
            approvals: [selectedPipeline.owner, "Platform"],
          },
        },
        null,
        2,
      ),
    );
  }, [selectedPipeline, setEditorValue]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-5 py-5 lg:px-8">
        <header className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Gauge className="size-5" />
              </div>
              <h1 className="text-2xl font-semibold tracking-normal">Forge Console</h1>
              <Badge variant={totals.blocked > 0 ? "destructive" : "success"}>
                {totals.blocked > 0 ? `${totals.blocked} blocked` : "Clear"}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Updated {formatTime(data?.updatedAt)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={density} onValueChange={(value) => setDensity(value as Density)}>
              <TabsList>
                <TabsTrigger value="comfortable">
                  <Rows3 className="size-4" />
                  Roomy
                </TabsTrigger>
                <TabsTrigger value="compact">
                  <Rows3 className="size-4" />
                  Dense
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button variant="outline" onClick={() => void refetch()}>
              <RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />
              Refresh
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Activity className="size-4" />}
            label="Deployments"
            value={totals.deploys.toLocaleString("en-US")}
            sublabel="last 7 days"
          />
          <MetricCard
            icon={<Database className="size-4" />}
            label="Monthly spend"
            value={new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(totals.spend)}
            sublabel={`${totals.warnings} warnings`}
          />
          <MetricCard
            icon={<Gauge className="size-4" />}
            label="Selected"
            value={selectedPipeline?.service ?? "None"}
            sublabel={selectedPipeline?.region ?? "pending"}
          />
          <MetricCard
            icon={<RefreshCw className={isFetching ? "size-4 animate-spin" : "size-4"} />}
            label="Query"
            value={isFetching ? "Syncing" : "Ready"}
            sublabel="18s refresh"
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(420px,0.8fr)]">
          <DataGridPanel rows={rows} />
          <EditorPanel />
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <ChartPanel metrics={metrics} />
          <Card>
            <CardHeader>
              <CardTitle>Queue pressure</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {rows.slice(0, 4).map((row) => (
                <div key={row.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{row.service}</span>
                    <span className="text-muted-foreground">{row.latency} ms</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, row.latency / 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  sublabel: string;
};

function MetricCard({ icon, label, value, sublabel }: MetricCardProps) {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="grid-cols-[1fr_auto] items-center px-4">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
        <div className="flex size-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <div className="truncate text-2xl font-semibold">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{sublabel}</div>
      </CardContent>
    </Card>
  );
}
