import { skipToken, useQuery } from "@tanstack/react-query";
import { ExternalLink, GitFork, LoaderCircle, Lock, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  connectionRepositoriesQueryKey,
  searchConnectionRepositories,
} from "../api/modules-snapshot";
import type {
  CodeSourceConnection,
  CodeSourceRepository,
  ModuleRepositorySelection,
} from "../types";

/** 在指定连接下搜索仓库，选中结果会写入后端仓库缓存，模块只提交连接 id 和外部仓库 id。 */
export function RepositoryPicker({
  connection,
  onChange,
  value,
}: {
  connection: CodeSourceConnection | undefined;
  onChange: (value: ModuleRepositorySelection | null) => void;
  value: ModuleRepositorySelection | null;
}) {
  const [keyword, setKeyword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const query = useDebouncedValue(keyword.trim());
  const connectionId = connection?.id ?? "";
  const shouldSearch = isOpen && connectionId !== "";
  const {
    data: repositories = [],
    error,
    isFetching,
  } = useQuery({
    queryFn: shouldSearch ? () => searchConnectionRepositories(connectionId, query) : skipToken,
    queryKey: connectionRepositoriesQueryKey(connectionId, query),
    retry: false,
    staleTime: 30_000,
  });

  const handleRepositorySelect = (repository: CodeSourceRepository) => {
    onChange({
      connectionId: repository.connectionId,
      defaultBranch: repository.defaultBranch,
      externalRepositoryId: repository.externalRepositoryId,
      fullName: repository.fullName,
      webUrl: repository.webUrl,
    });
    setKeyword("");
    setIsOpen(false);
  };

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted px-3 py-2">
        <GitFork className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-foreground text-sm">{value.fullName}</div>
          <div className="truncate text-muted-foreground text-xs">
            {value.defaultBranch ? `默认分支 ${value.defaultBranch}` : "默认分支未知"}
            {` · 仓库 ID ${value.externalRepositoryId}`}
          </div>
        </div>
        {value.webUrl ? (
          <Button asChild variant="ghost" size="sm" className="h-8 gap-1 px-2">
            <a href={value.webUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              打开
            </a>
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2"
          onClick={() => onChange(null)}
        >
          <X className="size-3.5" />
          更换
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <GitFork className="size-4 shrink-0 text-muted-foreground" />
        <Input
          value={keyword}
          disabled={!connection}
          placeholder={
            connection
              ? connection.provider === "gitlab"
                ? "搜索 GitLab 项目，例如 group/project"
                : "搜索 GitHub 仓库，例如 org/repo"
              : "请先选择代码源连接"
          }
          onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
          onChange={(event) => {
            setKeyword(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>
      {shouldSearch ? (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-card py-1 shadow-lg">
          {isFetching ? (
            <div className="flex h-10 items-center gap-2 px-3 text-muted-foreground text-sm">
              <LoaderCircle className="size-4 animate-spin" />
              搜索中
            </div>
          ) : null}
          {!isFetching && error ? (
            <div className="px-3 py-2 text-destructive text-sm">
              {error instanceof Error ? error.message : "仓库搜索失败，请检查代码源连接"}
            </div>
          ) : null}
          {!isFetching && !error && repositories.length === 0 ? (
            <div className="px-3 py-2 text-muted-foreground text-sm">未找到匹配仓库</div>
          ) : null}
          {repositories.map((repository) => (
            <Button
              key={repository.externalRepositoryId}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start rounded-none px-3 py-2 text-left font-normal hover:bg-muted"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleRepositorySelect(repository)}
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 truncate font-medium text-foreground text-sm">
                  {repository.private ? (
                    <Lock className="size-3 shrink-0 text-muted-foreground" />
                  ) : null}
                  <span className="truncate">{repository.fullName}</span>
                </span>
                <span className="block truncate text-muted-foreground text-xs">
                  {[
                    repository.defaultBranch ? `默认分支 ${repository.defaultBranch}` : "",
                    repository.description ?? "",
                  ]
                    .filter(Boolean)
                    .join(" · ") || "无描述"}
                </span>
              </span>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
