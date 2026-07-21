import { GitFork, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { searchCodeSourceRepositories } from "../api/modules-snapshot";
import type { ModuleRepositoryBinding } from "../types";

export function RepositoryPicker({
  onChange,
  value,
}: {
  onChange: (value: ModuleRepositoryBinding | null) => void;
  value: ModuleRepositoryBinding | null;
}) {
  const [keyword, setKeyword] = useState(value?.fullName ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [repositories, setRepositories] = useState<ModuleRepositoryBinding[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const selectedFullName = value?.fullName ?? "";

  useEffect(() => {
    if (selectedFullName && selectedFullName !== keyword) {
      setKeyword(selectedFullName);
    }
  }, [keyword, selectedFullName]);

  useEffect(() => {
    const query = keyword.trim();
    if (!isOpen || selectedFullName === keyword || query.length < 2) {
      setRepositories([]);
      setIsLoading(false);
      setError("");
      return;
    }

    let disposed = false;
    setIsLoading(true);
    setError("");
    const handle = window.setTimeout(() => {
      void searchCodeSourceRepositories(query)
        .then((nextRepositories) => {
          if (!disposed) {
            setRepositories(nextRepositories);
          }
        })
        .catch((searchError) => {
          if (!disposed) {
            setRepositories([]);
            setError(
              searchError instanceof Error
                ? searchError.message
                : "仓库搜索失败，请先确认代码源已配置并安装",
            );
          }
        })
        .finally(() => {
          if (!disposed) {
            setIsLoading(false);
          }
        });
    }, 280);

    return () => {
      disposed = true;
      window.clearTimeout(handle);
    };
  }, [isOpen, keyword, selectedFullName]);

  const handleRepositorySelect = (repository: ModuleRepositoryBinding) => {
    onChange(repository);
    setKeyword(repository.fullName);
    setRepositories([]);
    setIsOpen(false);
    setError("");
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <GitFork className="size-4 shrink-0 text-muted-foreground" />
        <Input
          value={keyword}
          placeholder="搜索 GitHub 授权仓库，例如 org/repo"
          onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
          onChange={(event) => {
            const nextKeyword = event.target.value;
            setKeyword(nextKeyword);
            if (value && nextKeyword !== value.fullName) {
              onChange(null);
            }
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>
      {value ? (
        <div className="mt-2 rounded-md border border-border bg-muted px-3 py-2 text-muted-foreground text-xs">
          已绑定 {value.fullName}
          {value.defaultBranch ? ` · 默认分支 ${value.defaultBranch}` : ""}
        </div>
      ) : null}
      {isOpen && keyword.trim().length >= 2 && selectedFullName !== keyword ? (
        <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-card py-1 shadow-lg">
          {isLoading ? (
            <div className="flex h-10 items-center gap-2 px-3 text-muted-foreground text-sm">
              <LoaderCircle className="size-4 animate-spin" />
              搜索中
            </div>
          ) : null}
          {!isLoading && error ? (
            <div className="px-3 py-2 text-destructive text-sm">{error}</div>
          ) : null}
          {!isLoading && !error && repositories.length === 0 ? (
            <div className="px-3 py-2 text-muted-foreground text-sm">未找到匹配仓库</div>
          ) : null}
          {repositories.map((repository) => (
            <Button
              key={`${repository.provider}-${repository.id}`}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start rounded-none px-3 py-2 text-left font-normal hover:bg-muted"
              onClick={() => handleRepositorySelect(repository)}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground text-sm">
                  {repository.fullName}
                </span>
                {repository.defaultBranch ? (
                  <span className="block truncate text-muted-foreground text-xs">
                    默认分支 {repository.defaultBranch}
                  </span>
                ) : null}
              </span>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
