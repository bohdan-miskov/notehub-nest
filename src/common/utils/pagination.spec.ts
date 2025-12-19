import { createPaginatedResponse, PaginatedResult } from './pagination';

describe('createPaginatedResponse', () => {
  it('should create correct response for the first page', () => {
    const dataArray = ['item1', 'item2', 'item3'];

    const expectedResponse: PaginatedResult<string> = {
      data: dataArray,
      page: 1,
      perPage: 3,
      totalItems: 20,
      totalPages: 7,
      hasPreviousPage: false,
      hasNextPage: true,
    };

    const result = createPaginatedResponse<string>([dataArray, 20], 1, 3);
    expect(result).toEqual(expectedResponse);
  });

  it('should create correct response for the last page', () => {
    const dataArray = ['item1', 'item2', 'item3'];

    const expectedResponse: PaginatedResult<string> = {
      data: dataArray,
      page: 7,
      perPage: 3,
      totalItems: 20,
      totalPages: 7,
      hasPreviousPage: true,
      hasNextPage: false,
    };

    const result = createPaginatedResponse<string>([dataArray, 20], 7, 3);
    expect(result).toEqual(expectedResponse);
  });
});
