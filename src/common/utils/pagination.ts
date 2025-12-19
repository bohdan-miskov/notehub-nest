export interface PaginatedResult<T> {
  data: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export function createPaginatedResponse<T>(
  data: [T[], number],
  page: number,
  perPage: number,
): PaginatedResult<T> {
  const [resultData, totalItems] = data;

  const totalPages = Math.ceil(totalItems / perPage);
  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

  return {
    data: resultData,
    page,
    perPage: perPage,
    totalItems,
    totalPages,
    hasPreviousPage,
    hasNextPage,
  };
}
