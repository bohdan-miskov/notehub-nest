import request from 'supertest';

export const getCookies = (res: request.Response): string[] => {
  return res.headers['set-cookie'] as unknown as string[];
};
