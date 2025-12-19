import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MockService } from 'src/common/types/mock.types';
import { RegisterDto } from './dto/register.dto';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { ForbiddenException } from '@nestjs/common';

function mockServiceFactory<T extends object>(): MockService<T> {
  return {
    get: jest.fn(),
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshTokens: jest.fn(),
  } as MockService<T>;
}

describe('AuthController', () => {
  let controller: AuthController;

  let mockAuthService: MockService<AuthService>;

  let mockRequest: Request;
  let mockResponse: Response;

  const refreshToken = 'refreshToken';
  const accessToken = 'accessToken';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockServiceFactory<AuthService>(),
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'NODE_ENV') return 'production';
              if (key.includes('MAX_AGE')) return 3600;
              return null;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    mockAuthService = module.get(AuthService);

    mockRequest = {
      cookies: {
        refreshToken: 'refreshToken',
      },
    } as unknown as Request;

    mockResponse = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    } as unknown as Response;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register user', async () => {
      const registerDto: RegisterDto = {
        name: 'User',
        email: 'user@mock.com',
        password: 'password',
      };

      mockAuthService.register?.mockResolvedValue({
        accessToken,
        refreshToken,
      });

      const result = await controller.register(registerDto, mockResponse);
      expect(result).toEqual({
        message: 'Registration successful',
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto);
      expect((mockResponse as Partial<Response>).cookie).toHaveBeenCalledWith(
        'accessToken',
        accessToken,
        expect.any(Object) as object,
      );
      expect((mockResponse as Partial<Response>).cookie).toHaveBeenCalledWith(
        'refreshToken',
        refreshToken,
        expect.any(Object) as object,
      );
    });
  });
  describe('login', () => {
    it('should successfully login user', async () => {
      const loginDto: LoginDto = {
        email: 'user@mock.com',
        password: 'password',
      };

      mockAuthService.login?.mockResolvedValue({
        accessToken,
        refreshToken,
      });

      const result = await controller.login(loginDto, mockResponse);
      expect(result).toEqual({
        message: 'Login successful',
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect((mockResponse as Partial<Response>).cookie).toHaveBeenCalledWith(
        'accessToken',
        accessToken,
        expect.any(Object) as object,
      );
      expect((mockResponse as Partial<Response>).cookie).toHaveBeenCalledWith(
        'refreshToken',
        refreshToken,
        expect.any(Object) as object,
      );
    });
  });
  describe('logout', () => {
    it('should successfully logout user', async () => {
      const result = await controller.logout(mockRequest, mockResponse);
      expect(result).toEqual({
        message: 'Logout successful',
      });

      expect(mockAuthService.logout).toHaveBeenCalledWith(
        mockRequest.cookies.refreshToken,
      );
      expect(
        (mockResponse as Partial<Response>).clearCookie,
      ).toHaveBeenCalledWith('accessToken');
      expect(
        (mockResponse as Partial<Response>).clearCookie,
      ).toHaveBeenCalledWith('refreshToken');
    });
  });
  describe('refresh', () => {
    it('should successfully refresh user tokens', async () => {
      mockAuthService.refreshTokens?.mockResolvedValue({
        accessToken,
        refreshToken,
      });

      const result = await controller.refreshTokens(mockRequest, mockResponse);
      expect(result).toEqual({ message: 'Tokens refreshed' });

      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(
        mockRequest.cookies.refreshToken,
      );
      expect((mockResponse as Partial<Response>).cookie).toHaveBeenCalledWith(
        'accessToken',
        accessToken,
        expect.any(Object) as object,
      );
      expect((mockResponse as Partial<Response>).cookie).toHaveBeenCalledWith(
        'refreshToken',
        refreshToken,
        expect.any(Object) as object,
      );
    });
    it('should throw ForbiddenException if refreshToken not exist', async () => {
      const badMockRequest = {
        cookies: {},
      } as unknown as Request;

      await expect(
        controller.refreshTokens(badMockRequest, mockResponse),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
