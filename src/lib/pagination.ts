export const DEFAULT_PAGE_SIZE = 12;

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Clamps raw page/pageSize input (e.g. from a URL query string) into safe skip/take values. */
export function resolvePagination({ page, pageSize }: PaginationParams) {
  const resolvedPageSize = pageSize && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE;
  const resolvedPage = page && page > 0 ? Math.floor(page) : 1;
  return { page: resolvedPage, pageSize: resolvedPageSize, skip: (resolvedPage - 1) * resolvedPageSize, take: resolvedPageSize };
}

export function buildPaginatedResult<T>(items: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
