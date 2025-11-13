import { ObjectLiteral, Repository } from 'typeorm';

export type MockRepository<T extends ObjectLiteral = any> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

export type MockService<T = any> = Partial<Record<keyof T, jest.Mock>>;
