import type { APISchemas } from "@/api/client";

export type PaginationParams = {
  page: number;
  pageSize: number;
};

export type PaginationMeta = APISchemas["Pagination"];
