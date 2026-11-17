import { ArrowLeft, RadioTower } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuthStore } from "@/store/use-auth-store";

import { GrayPercentageAdjustCard } from "./components/GrayPercentageAdjustCard";
import { ReleaseRecordDetailHeader } from "./components/ReleaseRecordDetailHeader";
import { ReleaseRecordInfoSection } from "./components/ReleaseRecordInfoSection";
import { useReleaseRecordDetail } from "./hooks";

type ReleaseRecordDetailPageProps = {
  onBack: () => void;
  onOpenApplication: (applicationSlug: string) => void;
  onOpenBuild: (buildId: string) => void;
  onOpenEnvironment: (environmentId: string) => void;
  onOpenModule: (moduleId: string) => void;
  releaseId: string;
};

export function ReleaseRecordDetailPage({
  onBack,
  onOpenApplication,
  onOpenBuild,
  onOpenEnvironment,
  onOpenModule,
  releaseId,
}: ReleaseRecordDetailPageProps) {
  const session = useAuthStore((state) => state.session);
  const canCreateRelease = Boolean(session?.capabilities.canCreateRelease);
  const {
    error,
    grayPercentageError,
    grayPercentageInput,
    grayPercentageMessage,
    grayPercentageMutation,
    inactivateError,
    inactivateMessage,
    inactivateMutation,
    isFetching,
    moduleSnapshot,
    release,
    setGrayPercentageError,
    setGrayPercentageInput,
    setGrayPercentageMessage,
    setInactivateError,
    setInactivateMessage,
  } = useReleaseRecordDetail(releaseId);

  if (!release) {
    return <ReleaseRecordDetailFallback error={error} isFetching={isFetching} onBack={onBack} />;
  }

  const applicationSlug = moduleSnapshot?.modules[0]?.applicationSlug ?? "";
  const canInactivateTargetedGray =
    release.status === "active" &&
    release.releaseType === "gray" &&
    release.grayStrategy === "targeted";

  return (
    <>
      <ReleaseRecordDetailHeader
        canCreateRelease={canCreateRelease}
        canInactivateTargetedGray={canInactivateTargetedGray}
        inactivateMutation={inactivateMutation}
        release={release}
        onBack={onBack}
        onOpenBuild={onOpenBuild}
        onInactivate={() => {
          if (!window.confirm("失效后该定向标识会回退到比例灰度或全量发布，是否继续？")) {
            return;
          }
          setInactivateError("");
          setInactivateMessage("");
          inactivateMutation.mutate();
        }}
      />

      <div className="space-y-4 px-6 py-5">
        {release.description ? (
          <Alert variant="info" icon={false} className="px-4 py-3">
            <div className="flex items-start gap-2">
              <RadioTower className="mt-0.5 size-4 shrink-0" />
              <div>
                <div className="font-semibold text-sm">发布说明</div>
                <div className="mt-1 whitespace-pre-wrap text-sm leading-6">
                  {release.description}
                </div>
              </div>
            </div>
          </Alert>
        ) : null}

        {inactivateError || inactivateMessage ? (
          <Alert variant={inactivateError ? "danger" : "success"}>
            {inactivateError || inactivateMessage}
          </Alert>
        ) : null}

        <ReleaseRecordInfoSection
          applicationSlug={applicationSlug}
          release={release}
          onOpenApplication={onOpenApplication}
          onOpenEnvironment={onOpenEnvironment}
          onOpenModule={onOpenModule}
        />

        {release.releaseType === "gray" && release.grayStrategy === "percentage" ? (
          <GrayPercentageAdjustCard
            canCreateRelease={canCreateRelease}
            grayPercentage={release.grayPercentage}
            grayPercentageError={grayPercentageError}
            grayPercentageInput={grayPercentageInput}
            grayPercentageMessage={grayPercentageMessage}
            grayPercentageMutation={grayPercentageMutation}
            onGrayPercentageInputChange={(value) => {
              setGrayPercentageInput(value);
              setGrayPercentageError("");
              setGrayPercentageMessage("");
            }}
            onUpdate={() => {
              const nextPercentage = Number(grayPercentageInput);
              if (!Number.isInteger(nextPercentage) || nextPercentage < 0 || nextPercentage > 100) {
                setGrayPercentageMessage("");
                setGrayPercentageError("请输入 0 到 100 之间的整数");
                return;
              }
              if (
                nextPercentage === 100 &&
                !window.confirm("比例更新为 100% 后将转为全量发布，是否继续？")
              ) {
                return;
              }
              grayPercentageMutation.mutate(nextPercentage);
            }}
          />
        ) : null}
      </div>
    </>
  );
}

function ReleaseRecordDetailFallback({
  error,
  isFetching,
  onBack,
}: {
  error: Error | null;
  isFetching: boolean;
  onBack: () => void;
}) {
  return (
    <>
      <div className="border-border border-b bg-card px-6 py-5">
        <Button
          variant="ghost"
          type="button"
          className="-ml-2 h-8 gap-2 px-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onBack}
        >
          <ArrowLeft className="size-4" />
          返回发布管理
        </Button>
      </div>
      <div className="px-6 py-5">
        <Card className="rounded-lg p-8 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <RadioTower className="size-5" />
          </div>
          <div className="mt-3 font-semibold text-foreground">
            {isFetching ? "正在加载发布记录详情" : "未找到发布记录"}
          </div>
          <div className="mt-2 text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "发布记录可能已被删除或当前账号无权限访问。"}
          </div>
        </Card>
      </div>
    </>
  );
}
