import { addDays } from './addDays';

describe('AddDays', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should add days correctly within the same month', () => {
    const expectedResponse = new Date('2025-01-08T00:00:00.000Z');

    const result = addDays(7);
    expect(result).toEqual(expectedResponse);
  });

  it('should handle the month rollover correctly', () => {
    const expectedResponse = new Date('2025-02-05T00:00:00.000Z');

    const result = addDays(35);
    expect(result).toEqual(expectedResponse);
  });
});
