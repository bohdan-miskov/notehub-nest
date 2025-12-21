import { INestApplication } from '@nestjs/common';
import { createTestApp, TestApp } from './utils/setup';
import { RegisterDto } from 'src/auth/dto/register.dto';
import request from 'supertest';
import { App } from 'supertest/types';
import { LoginDto } from 'src/auth/dto/login.dto';
import { getCookies } from './utils/helpers';

describe('AuthModule (e2e)', () => {
  let testApp: TestApp;
  let app: INestApplication;
  let userCookies: string[];

  const uniqueId = Date.now();

  const userDto = {
    name: 'testUser',
    email: `test${uniqueId}@mock.com`,
    password: 'mockPassword',
  };

  beforeAll(async () => {
    testApp = await createTestApp();
    app = testApp.app;
    await testApp.cleanup();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register', () => {
    it('should register a new user successfully (201)', () => {
      const registerDto: RegisterDto = { ...userDto };

      return request(app.getHttpServer() as App)
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          const body = res.body as { message: string };
          userCookies = getCookies(res);

          expect(body?.message).toBe('Registration successful');
          expect(userCookies).toBeDefined();
          expect(userCookies.some((c) => c.includes('accessToken')));
          expect(userCookies.some((c) => c.includes('refreshToken')));
        });
    });
    it('should fail if email already exists (409)', () => {
      const registerDto: RegisterDto = { ...userDto };
      return request(app.getHttpServer() as App)
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });
  });

  describe('/auth/login', () => {
    it('should login and return tokens (200)', () => {
      const loginDto: LoginDto = {
        email: userDto.email,
        password: userDto.password,
      };

      return request(app.getHttpServer() as App)
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          const body = res.body as { message: string };
          userCookies = getCookies(res);

          expect(body.message).toBe('Login successful');
          expect(userCookies).toBeDefined();
          expect(userCookies.some((c) => c.includes('accessToken')));
          expect(userCookies.some((c) => c.includes('refreshToken')));
        });
    });
    it('should fail with wrong password (401)', () => {
      const loginDto: LoginDto = {
        email: userDto.email,
        password: 'fake' + userDto.password,
      };

      return request(app.getHttpServer() as App)
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('/auth/refresh', () => {
    it('should return new tokens using valid Refresh Token cookie (200)', () => {
      return request(app.getHttpServer() as App)
        .post('/auth/refresh')
        .set('Cookie', userCookies)
        .expect(200)
        .expect((res) => {
          const body = res.body as { message: string };
          userCookies = getCookies(res);

          expect(body.message).toBe('Tokens refreshed');
          expect(userCookies).toBeDefined();
          expect(userCookies.some((c) => c.includes('accessToken')));
          expect(userCookies.some((c) => c.includes('refreshToken')));
        });
    });
    it('should fail if Refresh Token is missing or invalid (401)', () => {
      return request(app.getHttpServer() as App)
        .post('/auth/refresh')
        .expect(401);
    });
  });

  describe('/auth/logout', () => {
    it('should clear cookies from response headers (200)', () => {
      return request(app.getHttpServer() as App)
        .post('/auth/logout')
        .set('Cookie', userCookies)
        .expect(200)
        .expect((res) => {
          const body = res.body as { message: string };

          userCookies = getCookies(res);
          expect(body.message).toBe('Logout successful');
          expect(userCookies).toBeDefined();
          expect(userCookies.some((c) => c.includes('accessToken=;')));
          expect(userCookies.some((c) => c.includes('refreshToken=;')));
        });
    });
    it('should fail to refresh tokens after logout (401)', () => {
      return request(app.getHttpServer() as App)
        .post('/auth/refresh')
        .set('Cookie', userCookies)
        .expect(401);
    });
  });
});
