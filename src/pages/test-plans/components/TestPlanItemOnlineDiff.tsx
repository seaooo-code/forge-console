import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { type OnlineReleaseCommit, ReleaseCommitDiff } from "@/components/common/ReleaseCommitDiff";
import { Button } from "@/components/ui/button";

import type { TestPlanItemRecord } from "../api";

/**
 * 提测条目和提测环境线上全量的提交差异，帮助测试同学确定测试范围。默认收起，展开时才请求比较接口。
 */
export function TestPlanItemOnlineDiff({
  item,
  online,
}: {
  item: TestPlanItemRecord;
  online: OnlineReleaseCommit | undefined;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = isOpen ? ChevronDown : ChevronRight;

  return (
    <div className="basis-full">
      <Button
        variant="link"
        className="h-auto gap-1 p-0 text-muted-foreground text-xs"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
      >
        <Icon className="size-3.5" />
        和线上全量的差异
      </Button>
      {isOpen ? (
        <div className="mt-2 rounded-lg bg-background p-3">
          <ReleaseCommitDiff
            branch={item.branch}
            buildId={item.buildRecordId}
            commitSha={item.commitSha}
            moduleId={item.moduleId}
            online={online}
            targetLabel="提测构建"
          />
        </div>
      ) : null}
    </div>
  );
}
