import { INestApplication } from '@nestjs/common';
import { RegisterDto } from 'src/auth/dto/register.dto';
import request from 'supertest';
import { App } from 'supertest/types';
import { randomUUID } from 'crypto';

export const getCookies = (res: request.Response): string[] => {
  return res.headers['set-cookie'] as unknown as string[];
};

export const registerUser = async (
  app: INestApplication,
  registerDto: Partial<RegisterDto> = {},
): Promise<string[]> => {
  const uniqueId = randomUUID();
  const baseRegisterDto: RegisterDto = {
    name: 'testUser',
    email: `test${uniqueId}@mock.com`,
    password: 'mockPassword',
    ...registerDto,
  };
  const response = await request(app.getHttpServer() as App)
    .post('/auth/register')
    .send(baseRegisterDto)
    .expect(201);

  return getCookies(response);
};
