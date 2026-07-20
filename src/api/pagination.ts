import type { PaginationMeta, PaginationParams } from "@/types/pagination";

export const defaultPagination: PaginationParams = {
  page: 1,
  pageSize: 20,
};

const maxPageSize = 100;

export function normalizePagination(pagination?: Partial<PaginationParams>): PaginationParams {
  return {
    page: pagination?.page ?? defaultPagination.page,
    pageSize: pagination?.pageSize ?? defaultPagination.pageSize,
  };
}

export async function fetchAllPaginatedItems<
  TItem,
  TSnapshot extends { pagination: PaginationMeta },
>(
  fetchPage: (pagination: PaginationParams) => Promise<TSnapshot>,
  getItems: (snapshot: TSnapshot) => TItem[],
) {
  const items: TItem[] = [];
  let page = 1;
  let snapshot: TSnapshot;
  let pageItems: TItem[];

  do {
    snapshot = await fetchPage({ page, pageSize: maxPageSize });
    pageItems = getItems(snapshot);
    items.push(...pageItems);
    page += 1;
  } while (pageItems.length > 0 && items.length < snapshot.pagination.total);

  return {
    items,
    snapshot,
  };
}
