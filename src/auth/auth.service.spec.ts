import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { MockService } from 'src/common/types/mock.types';
import { UsersService } from 'src/users/users.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { User } from 'src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { Session } from 'src/sessions/entities/session.entity';
import { addDays } from 'src/common/utils/addDays';

function mockServiceFactory<T extends object>(): MockService<T> {
  return {
    findOneByEmail: jest.fn(),
    create: jest.fn(),
    findByHash: jest.fn(),
    removeByHash: jest.fn(),
    signAsync: jest.fn(),
    get: jest.fn(),
  } as MockService<T>;
}

function mockUserFactory(props: Partial<User> = {}): User {
  return {
    id: 1,
    name: 'testUser',
    email: 'test@example.com',
    password: '$2b$10$C8iH2iwkHWPbD7CMer/ruOmOGRcMmdSmzA3thShgNO97fGbnd93pW',
    notes: [],
    sessions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...props,
  };
}

function mockSessionFactory(props: Partial<Session> = {}): Session {
  return {
    id: 1,
    user: { id: 1 } as User,
    refreshTokenHash: 'hash',
    expiresAt: addDays(7),
    createdAt: new Date(),
    ...props,
  };
}

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  let mockUsersService: MockService<UsersService>;
  let mockSessionsService: MockService<SessionsService>;
  let mockJwtService: MockService<JwtService>;
  let mockConfigService: MockService<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockServiceFactory<UsersService>(),
        },
        {
          provide: SessionsService,
          useValue: mockServiceFactory<SessionsService>(),
        },
        {
          provide: JwtService,
          useValue: mockServiceFactory<JwtService>(),
        },
        {
          provide: ConfigService,
          useValue: mockServiceFactory<ConfigService>(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockUsersService = module.get(UsersService);
    mockSessionsService = module.get(SessionsService);
    mockJwtService = module.get(JwtService);
    mockConfigService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const hashedPassword = 'mockedHashedPassword';
      const accessToken = 'access_token';
      const refreshToken = 'refresh_token';

      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      mockUsersService.findOneByEmail?.mockResolvedValue(null);

      const registerDto: RegisterDto = {
        name: 'Test user',
        email: 'user@example',
        password: 'password',
      };

      const mockUser = mockUserFactory({
        ...registerDto,
        password: hashedPassword,
      });
      mockUsersService.create?.mockResolvedValue(mockUser);

      mockConfigService.get?.mockReturnValueOnce(null);

      mockJwtService.signAsync?.mockResolvedValueOnce(accessToken);
      mockJwtService.signAsync?.mockResolvedValueOnce(refreshToken);

      const result = await service.register(registerDto);
      expect(result).toEqual({
        accessToken: accessToken,
        refreshToken: refreshToken,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registerDto,
        password: hashedPassword,
      });
      expect(mockSessionsService.create).toHaveBeenCalledWith({
        user: mockUser,
        refreshTokenHash: expect.any(String) as string,
        expiresAt: expect.any(Date) as Date,
      });
    });
    it('should throw ConflictException if user already exist', async () => {
      const registerDto: RegisterDto = {
        name: 'mockUser',
        email: 'user@mock.com',
        password: 'password',
      };

      const mockUser = mockUserFactory({ email: registerDto.email });
      mockUsersService.findOneByEmail?.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
    });
  });

  describe('login', () => {
    it('should successfully login user', async () => {
      const loginDto: LoginDto = {
        email: 'user@mock.com',
        password: 'password',
      };

      const accessToken = 'accessToken';
      const refreshToken = 'refreshToken';

      const mockUser = mockUserFactory({
        ...loginDto,
        password: 'hashedPassword',
      });
      mockUsersService.findOneByEmail?.mockResolvedValue(mockUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockConfigService.get?.mockReturnValue(7);

      mockJwtService.signAsync?.mockResolvedValueOnce(accessToken);
      mockJwtService.signAsync?.mockResolvedValueOnce(refreshToken);

      const result = await service.login(loginDto);
      expect(result).toEqual({
        accessToken,
        refreshToken,
      });

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(mockSessionsService.create).toHaveBeenCalledWith({
        user: mockUser,
        refreshTokenHash: expect.any(String) as string,
        expiresAt: expect.any(Date) as Date,
      });
    });
    it('should throw UnauthorizedException if user not exist', async () => {
      const loginDto: LoginDto = {
        email: 'user@mock.com',
        password: 'password',
      };
      mockUsersService.findOneByEmail?.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
    });
    it('should throw UnauthorizedException if password is not correct', async () => {
      const loginDto: LoginDto = {
        email: 'user@mock.com',
        password: 'password',
      };

      const mockUser = mockUserFactory({
        ...loginDto,
        password: 'hashedPassword',
      });
      mockUsersService.findOneByEmail?.mockResolvedValue(mockUser);

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
    });
  });
  describe('logout', () => {
    it('should successfully logout user', async () => {
      const refreshToken = 'refreshToken';

      const result = await service.logout(refreshToken);
      expect(result).toEqual(undefined);

      expect(mockSessionsService.removeByHash).toHaveBeenCalledWith(
        expect.any(String) as string,
      );
    });
  });
  describe('refreshToken', () => {
    it('should successfully refresh user tokens', async () => {
      const refreshToken = 'refreshToken';
      const newRefreshToken = 'newRefreshToken';
      const newAccessToken = 'newAccessToken';

      const mockSession = mockSessionFactory();
      mockSessionsService.findByHash?.mockResolvedValue(mockSession);

      mockConfigService.get?.mockReturnValue(7);

      mockJwtService.signAsync?.mockResolvedValueOnce(newAccessToken);
      mockJwtService.signAsync?.mockResolvedValueOnce(newRefreshToken);

      const result = await service.refreshTokens(refreshToken);
      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });

      expect(mockSessionsService.findByHash).toHaveBeenCalledWith(
        expect.any(String) as string,
      );
      expect(mockSessionsService.removeByHash).toHaveBeenCalledWith(
        expect.any(String) as string,
      );
      expect(mockSessionsService.create).toHaveBeenCalledWith({
        user: mockSession.user,
        refreshTokenHash: expect.any(String) as string,
        expiresAt: expect.any(Date) as Date,
      });
    });
    it('should throw ForbiddenException if refreshToken is not correct', async () => {
      const refreshToken = 'refreshToken';

      mockSessionsService.findByHash?.mockResolvedValue(null);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockSessionsService.findByHash).toHaveBeenCalledWith(
        expect.any(String) as string,
      );
    });
    it('should throw ForbiddenException if refreshToken expired', async () => {
      const refreshToken = 'refreshToken';
      const mockSession = mockSessionFactory({
        expiresAt: addDays(-1),
      });

      mockSessionsService.findByHash?.mockResolvedValue(mockSession);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockSessionsService.findByHash).toHaveBeenCalledWith(
        expect.any(String) as string,
      );
      expect(mockSessionsService.removeByHash).toHaveBeenCalledWith(
        expect.any(String) as string,
      );
    });
  });
});
