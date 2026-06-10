import { MockCard as Card } from "@/components/common/MockSurface";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { PipelineSuccessRate } from "../types";

type PipelineSuccessPanelProps = {
  rates: PipelineSuccessRate[];
};

export function PipelineSuccessPanel({ rates }: PipelineSuccessPanelProps) {
  const overallRate = 94;

  return (
    <Card className="rounded-lg py-0 shadow-none">
      <CardHeader className="h-12 border-b px-4 py-0">
        <CardTitle className="flex h-full items-center text-slate-900 text-sm">
          流水线成功率
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-5">
        <div className="flex items-center gap-5">
          <div
            className="grid size-24 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#0f7ae5 ${overallRate * 3.6}deg, #e8eef7 0deg)`,
            }}
          >
            <div className="size-17.5 rounded-full bg-white" />
          </div>
          <div>
            <div className="font-semibold text-3xl text-slate-900">{overallRate}%</div>
            <div className="mt-1 text-slate-500 text-xs">近 7 天整体成功率</div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {rates.map((rate) => (
            <div key={rate.name} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-600">{rate.name}</span>
                <span className="font-semibold text-slate-600">{rate.rate}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${rate.rate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
