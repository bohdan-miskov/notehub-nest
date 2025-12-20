import { INestApplication } from '@nestjs/common';
import { createTestApp, TestApp } from './utils/setup';
import request from 'supertest';
import { App } from 'supertest/types';
import { RegisterDto } from 'src/auth/dto/register.dto';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { getCookies } from './utils/helpers';

describe('UsersModule (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let appCookies: string[];

  const uniqueId = Date.now();

  const userDto = {
    name: 'testUser',
    email: `test${uniqueId}@mock.com`,
    password: 'mockPassword',
  };

  const responseUser = {
    id: expect.any(Number) as number,
    name: userDto.name,
    email: userDto.email,
    updatedAt: expect.any(String) as string,
    createdAt: expect.any(String) as string,
  };

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    await testApp.cleanup();

    const registerDto: RegisterDto = { ...userDto };
    const response = await request(app.getHttpServer() as App)
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    appCookies = getCookies(response);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users/me (GET)', () => {
    it('should return current user profile (200)', () => {
      return request(app.getHttpServer() as App)
        .get('/users/me')
        .set('Cookie', appCookies)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(responseUser);
        });
    });
    it('should deny access without cookies (401)', () => {
      return request(app.getHttpServer() as App)
        .get('/users/me')
        .expect(401);
    });
  });

  describe('/users/me (PATCH)', () => {
    it('should update user name successfully (200)', async () => {
      const beforeUpdateRes = await request(app.getHttpServer() as App)
        .get('/users/me')
        .set('Cookie', appCookies)
        .expect(200);

      const oldBody = beforeUpdateRes.body as { updatedAt: string };
      const oldUpdatedAt = new Date(
        oldBody?.updatedAt as unknown as string,
      ).getTime();

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updateUserDto: UpdateUserDto = {
        name: 'newTestUser',
      };
      return request(app.getHttpServer() as App)
        .patch('/users/me')
        .set('Cookie', appCookies)
        .send(updateUserDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            ...responseUser,
            ...updateUserDto,
          });
          const body = res.body as { updatedAt: string; createdAt: string };
          const createdAt = new Date(
            body?.createdAt as unknown as string,
          ).getTime();
          const updatedAt = new Date(
            body?.updatedAt as unknown as string,
          ).getTime();

          expect(updatedAt).toBeGreaterThan(createdAt);
          expect(updatedAt).toBeGreaterThan(oldUpdatedAt);
        });
    });
    it('should fail validation when name is empty (400)', () => {
      return request(app.getHttpServer() as App)
        .patch('/users/me')
        .set('Cookie', appCookies)
        .send({ name: '' })
        .expect(400)
        .expect((res) => {
          const body = res.body as { message: string };
          expect(body.message).toEqual(
            expect.arrayContaining([expect.stringContaining('name')]),
          );
        });
    });
  });
});
