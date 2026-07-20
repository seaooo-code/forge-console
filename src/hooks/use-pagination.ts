import { useCallback, useState } from "react";

export function usePagination(initialPageSize = 20) {
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const setPage = useCallback((nextPage: number) => {
    setPageState(Math.max(1, nextPage));
  }, []);

  const setPageSize = useCallback((nextPageSize: number) => {
    setPageSizeState(nextPageSize);
    setPageState(1);
  }, []);

  const resetPage = useCallback(() => {
    setPageState(1);
  }, []);

  const clampPage = useCallback(
    (total: number) => {
      const totalPages = Math.max(1, Math.ceil(total / pageSize));
      setPageState((currentPage) => Math.min(currentPage, totalPages));
    },
    [pageSize],
  );

  return {
    clampPage,
    page,
    pageSize,
    resetPage,
    setPage,
    setPageSize,
  };
}
