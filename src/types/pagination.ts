export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginationMeta = PaginationParams & {
  total: number;
};
