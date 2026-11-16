import { Box, CalendarClock, Layers, RadioTower, UserRound } from "lucide-react";

import { Card } from "@/components/ui/card";

import { getReleaseRecordTargetLabel, getReleaseRecordTypeLabel } from "../constants";
import type { ReleaseRecordDetail } from "../types";
import { DetailItem, SectionHeader } from "./DetailPrimitives";

type ReleaseRecordInfoSectionProps = {
  applicationSlug: string;
  onOpenApplication: (applicationSlug: string) => void;
  onOpenEnvironment: (environmentId: string) => void;
  onOpenModule: (moduleId: string) => void;
  release: ReleaseRecordDetail;
};

export function ReleaseRecordInfoSection({
  applicationSlug,
  onOpenApplication,
  onOpenEnvironment,
  onOpenModule,
  release,
}: ReleaseRecordInfoSectionProps) {
  const releaseTarget = getReleaseRecordTargetLabel(release);

  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
      <Card className="gap-0 rounded-lg border-border py-0 shadow-sm">
        <SectionHeader title="发布信息" />
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <DetailItem icon={CalendarClock} label="发布时间" value={release.createdAt} />
          <DetailItem icon={CalendarClock} label="更新时间" value={release.updatedAtFull} />
          <DetailItem
            icon={RadioTower}
            label="发布目标"
            value={releaseTarget}
            description={
              release.releaseType === "gray" ? getReleaseRecordTypeLabel(release) : undefined
            }
          />
          {release.releaseType === "gray" && release.grayStrategy === "targeted" ? (
            <DetailItem
              icon={CalendarClock}
              label="过期时间"
              value={release.expiresAt}
              description="到期后自动失效"
            />
          ) : null}
          <DetailItem
            icon={Layers}
            label="运行时版本"
            value={release.runtimeVersion || "-"}
            description="只替换该运行时版本下的同类发布"
          />
          <DetailItem icon={UserRound} label="操作人" value={release.operator} />
        </div>
      </Card>

      <Card className="gap-0 rounded-lg border-border py-0 shadow-sm">
        <SectionHeader title="路由指向" />
        <div className="grid gap-3 p-4 md:grid-cols-2">
          <DetailItem
            icon={Box}
            label="应用"
            value={release.application}
            onClick={applicationSlug ? () => onOpenApplication(applicationSlug) : undefined}
          />
          <DetailItem
            icon={RadioTower}
            label="环境"
            value={release.environmentName}
            description={release.environment}
            onClick={
              release.environment && release.environment !== "-"
                ? () => onOpenEnvironment(release.environment)
                : undefined
            }
          />
          <DetailItem
            icon={Box}
            label="模块"
            value={release.module}
            description={release.moduleId}
            onClick={
              release.moduleId && release.moduleId !== "-"
                ? () => onOpenModule(release.moduleId)
                : undefined
            }
          />
        </div>
      </Card>
    </section>
  );
}
